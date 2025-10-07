#include "png_transfer.h"
#include "png.h"
#include "esp_log.h"
#include "esp_err.h"
#include "esp_heap_caps.h"
#include "driver/uart.h"

static const char *TAG = "PNG";

static uint32_t crc32_table[256];

void crc32_init_table(void) {
    for (uint32_t i = 0; i < 256; ++i) {
        uint32_t c = i;
        for (int j = 0; j < 8; ++j) {
            if (c & 1)
                c = 0xEDB88320L ^ (c >> 1);
            else
                c >>= 1;
        }
        crc32_table[i] = c;
    }
}

uint32_t crc32_update(uint32_t crc, const uint8_t *buf, size_t len) {
    crc ^= 0xFFFFFFFF;
    for (size_t i = 0; i < len; ++i) {
        crc = (crc >> 8) ^ crc32_table[(crc ^ buf[i]) & 0xFF];
    }
    return crc ^ 0xFFFFFFFF;
}

/**
 * @brief Decode PNG into caller-provided buffer (must be large enough).
 *        Uses in-place row-by-row decoding (no row_pointers allocation).
 *
 * @param fp            Pointer to open PNG file.
 * @param buffer        Target buffer in PSRAM (must be large enough).
 * @param buffer_size   Size of target buffer in bytes.
 *
 * @return Total number of bytes written to buffer on success, -1 on failure.
 */
int decode_png_to_rgba(const FILE *fp, uint8_t *buffer, uint32_t buffer_size) {
    if (!fp || !buffer) {
        ESP_LOGE(TAG, "Invalid input: file or buffer is NULL");
        return -1;
    }

    png_byte header[8];
    fread(header, 1, 8, fp);
    if (png_sig_cmp(header, 0, 8)) {
        ESP_LOGE(TAG, "Not a PNG file");
        return -1;
    }

    png_structp png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png_ptr) {
        ESP_LOGE(TAG, "Failed to create PNG read struct");
        return -1;
    }

    png_infop info_ptr = png_create_info_struct(png_ptr);
    if (!info_ptr) {
        png_destroy_read_struct(&png_ptr, NULL, NULL);
        ESP_LOGE(TAG, "Failed to create PNG info struct");
        return -1;
    }

    if (setjmp(png_jmpbuf(png_ptr))) {
        ESP_LOGE(TAG, "PNG error during decoding");
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        return -1;
    }

    png_init_io(png_ptr, fp);
    png_set_sig_bytes(png_ptr, 8);
    png_read_info(png_ptr, info_ptr);

    int width = png_get_image_width(png_ptr, info_ptr);
    int height = png_get_image_height(png_ptr, info_ptr);
    png_byte color_type = png_get_color_type(png_ptr, info_ptr);
    png_byte bit_depth = png_get_bit_depth(png_ptr, info_ptr);

    if (bit_depth == 16) png_set_strip_16(png_ptr);
    if (color_type == PNG_COLOR_TYPE_PALETTE) png_set_palette_to_rgb(png_ptr);
    if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8) png_set_expand_gray_1_2_4_to_8(png_ptr);
    if (png_get_valid(png_ptr, info_ptr, PNG_INFO_tRNS)) png_set_tRNS_to_alpha(png_ptr);

    png_set_filler(png_ptr, 0xFF, PNG_FILLER_AFTER); // Force RGBA
    png_set_gray_to_rgb(png_ptr);

    png_read_update_info(png_ptr, info_ptr);

    size_t rowbytes = png_get_rowbytes(png_ptr, info_ptr);
    uint32_t total_bytes = height * rowbytes;

    if (total_bytes > buffer_size) {
        ESP_LOGE(TAG, "Provided buffer too small. Required: %lu, Given: %lu", total_bytes, buffer_size);
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        return -1;
    }

    for (int y = 0; y < height; y++) {
        uint8_t *row = buffer + y * rowbytes;
        png_read_row(png_ptr, row, NULL);

        // Optional: Convert RGBA → BGRA (for STM32 compatibility)
        for (int x = 0; x < width; x++) {
            uint8_t *pixel = &row[x * 4];
            uint8_t temp = pixel[0];    // R
            pixel[0] = pixel[2];        // B
            pixel[2] = temp;            // R → B
        }
    }

    png_destroy_read_struct(&png_ptr, &info_ptr, NULL);

    return total_bytes; // success
}

uint32_t crc32_png_rgba(FILE *fp) {
    if (!fp) return 0;

    crc32_init_table();

    png_byte header[8];
    fread(header, 1, 8, fp);
    if (png_sig_cmp(header, 0, 8)) return 0;

    png_structp png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png_ptr) return 0;

    png_infop info_ptr = png_create_info_struct(png_ptr);
    if (!info_ptr) {
        png_destroy_read_struct(&png_ptr, NULL, NULL);
        return 0;
    }

    if (setjmp(png_jmpbuf(png_ptr))) {
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        return 0;
    }

    png_init_io(png_ptr, fp);
    png_set_sig_bytes(png_ptr, 8);
    png_read_info(png_ptr, info_ptr);

    int width = png_get_image_width(png_ptr, info_ptr);
    int height = png_get_image_height(png_ptr, info_ptr);
    png_byte color_type = png_get_color_type(png_ptr, info_ptr);
    png_byte bit_depth = png_get_bit_depth(png_ptr, info_ptr);

    if (bit_depth == 16) png_set_strip_16(png_ptr);
    if (color_type == PNG_COLOR_TYPE_PALETTE) png_set_palette_to_rgb(png_ptr);
    if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8) png_set_expand_gray_1_2_4_to_8(png_ptr);
    if (png_get_valid(png_ptr, info_ptr, PNG_INFO_tRNS)) png_set_tRNS_to_alpha(png_ptr);

    png_set_filler(png_ptr, 0xFF, PNG_FILLER_AFTER); // Force RGBA
    png_set_gray_to_rgb(png_ptr);

    png_read_update_info(png_ptr, info_ptr);

    size_t rowbytes = png_get_rowbytes(png_ptr, info_ptr);
    uint8_t *row = malloc(rowbytes);
    if (!row) {
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        return 0;
    }

    uint32_t crc = 0xFFFFFFFF;

    for (int y = 0; y < height; y++) {
        png_read_row(png_ptr, row, NULL);

        // Optional: RGBA → BGRA swap for STM32 compatibility
        for (int x = 0; x < width; x++) {
            uint8_t tmp = row[x * 4 + 0];  // R
            row[x * 4 + 0] = row[x * 4 + 2]; // B
            row[x * 4 + 2] = tmp;           // R ←→ B
        }

        // Incrementally update CRC32
        crc = crc32_update(crc, row, rowbytes);
    }

    free(row);
    png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
    return crc;
}
