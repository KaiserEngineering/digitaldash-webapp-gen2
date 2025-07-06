#include "png_transfer.h"
#include "png.h"
#include "esp_log.h"
#include "esp_err.h"
#include "esp_heap_caps.h"
#include "driver/uart.h"

static const char *TAG = "PNG";

/**
 * @brief Decodes a PNG image file into a linear buffer of pixel data in ARGB format.
 *
 * This function reads a PNG image from the filesystem and decodes it into a
 * raw pixel buffer stored in SPI RAM. The resulting buffer contains 4 bytes
 * per pixel in ARGB order (alpha = 0xFF, fully opaque). Any transparency in
 * the original PNG is stripped and replaced with opaque alpha.
 *
 * PNG transformations applied:
 *   - Strips 16-bit depth down to 8-bit if necessary
 *   - Converts palette and grayscale images to RGB
 *   - Strips existing alpha (including tRNS transparency)
 *   - Adds 0xFF as filler before RGB bytes, forming ARGB
 *
 * Memory is allocated using heap_caps_malloc() with MALLOC_CAP_SPIRAM, suitable
 * for large images on ESP32-S3 with external RAM enabled.
 *
 * @param filename      Path to the PNG file to decode.
 * @param out_width     Pointer to store the width of the decoded image.
 * @param out_height    Pointer to store the height of the decoded image.
 *
 * @return Pointer to a buffer containing the ARGB image data (4 bytes per pixel),
 *         or NULL on failure. Caller is responsible for freeing this buffer.
 */
static uint8_t* decode_png_to_rgba(const FILE *fp, int *out_width, int *out_height) {
    if (!fp) {
        ESP_LOGE(TAG, "Invalid file provided");
        return NULL;
    }

    png_byte header[8];
    fread(header, 1, 8, fp);
    if (png_sig_cmp(header, 0, 8)) {
        ESP_LOGE(TAG, "Not a PNG file");
        //fclose(fp);
        return NULL;
    }

    png_structp png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png_ptr) {
        //fclose(fp);
        ESP_LOGE(TAG, "Failed to create png read struct");
        return NULL;
    }

    png_infop info_ptr = png_create_info_struct(png_ptr);
    if (!info_ptr) {
        png_destroy_read_struct(&png_ptr, NULL, NULL);
        //fclose(fp);
        ESP_LOGE(TAG, "Failed to create png info struct");
        return NULL;
    }

    if (setjmp(png_jmpbuf(png_ptr))) {
        ESP_LOGE(TAG, "PNG error during init_io");
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        //fclose(fp);
        return NULL;
    }

    png_init_io(png_ptr, fp);
    png_set_sig_bytes(png_ptr, 8);

    png_read_info(png_ptr, info_ptr);

    int width = png_get_image_width(png_ptr, info_ptr);
    int height = png_get_image_height(png_ptr, info_ptr);
    png_byte color_type = png_get_color_type(png_ptr, info_ptr);
    png_byte bit_depth = png_get_bit_depth(png_ptr, info_ptr);

    ESP_LOGI(TAG, "PNG loaded: %dx%d", width, height);

    if (bit_depth == 16) png_set_strip_16(png_ptr);
    if (color_type == PNG_COLOR_TYPE_PALETTE) png_set_palette_to_rgb(png_ptr);
    if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8) png_set_expand_gray_1_2_4_to_8(png_ptr);
    if (png_get_valid(png_ptr, info_ptr, PNG_INFO_tRNS)) png_set_tRNS_to_alpha(png_ptr);

    png_set_filler(png_ptr, 0xFF, PNG_FILLER_AFTER); // Force RGBA
    png_set_gray_to_rgb(png_ptr);

    png_read_update_info(png_ptr, info_ptr);

    size_t rowbytes = png_get_rowbytes(png_ptr, info_ptr);
    png_bytep *row_pointers = heap_caps_malloc(sizeof(png_bytep) * height, MALLOC_CAP_SPIRAM);
    uint8_t *image_data = heap_caps_malloc(height * rowbytes, MALLOC_CAP_SPIRAM);

    if (!image_data || !row_pointers) {
        ESP_LOGE(TAG, "Memory allocation failed");
        //fclose(fp);
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        free(image_data);
        free(row_pointers);
        return NULL;
    }

    for (int y = 0; y < height; y++) {
        row_pointers[y] = image_data + y * rowbytes;
    }

    png_read_image(png_ptr, row_pointers);

    // Convert RGBA to BGRA by swapping R and B.
    // This is needed for the memory structure in the STM32
    for (int y = 0; y < height; y++) {
        uint8_t *row = image_data + y * rowbytes;
        for (int x = 0; x < width; x++) {
            uint8_t *pixel = row + x * 4;
            uint8_t temp = pixel[0];   // R
            pixel[0] = pixel[2];       // B → R
            pixel[2] = temp;           // R → B
        }
    }

    png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
    //fclose(fp);
    free(row_pointers);

    *out_width = width;
    *out_height = height;
    return image_data;
}

/**
 * @brief Loads a PNG image from a file and transmits its ARGB pixel data over UART.
 *
 * This function decodes a PNG image file using `decode_png_to_rgba()` and sends
 * the raw pixel buffer (formatted as ARGB, 4 bytes per pixel) over UART, one byte
 * at a time. The PNG image is assumed to have been preprocessed to include an alpha
 * channel (or filler) in the ARGB layout.
 *
 * @param filename Path to the PNG image file stored on the filesystem.
 *
 * @return true if the PNG was successfully loaded and transmitted, false otherwise.
 *
 * @note This function assumes the UART is already initialized. Transmission is
 *       done byte-by-byte;
 */
int transfer_png_data(const FILE *fp)
{
    int png_width = 0;
    int png_height = 0;
    int png_size = 0;
    uint8_t *rgba = decode_png_to_rgba(fp, &png_width, &png_height);

    png_size = png_width * png_height * 4;

    heap_caps_print_heap_info(MALLOC_CAP_DEFAULT);

    if (rgba) {
        for (int i = 0; i < png_size; i++) {
            uint8_t byte = rgba[i];

            if ((i % (png_width * 4)) == 0)
                ESP_LOGI(TAG, "Row[%d]: WRITTEN", i / (png_width * 4));

            //uart_write_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER, &byte, 1);
        }

        free(rgba); // Clean up memory
        return png_size; // Return total bytes transferred
    } else {
        ESP_LOGE(TAG, "Failed to decode PNG.");
        return 0;
    }
}