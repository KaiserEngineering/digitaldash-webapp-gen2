/*
 * SPDX-FileCopyrightText: 2010-2022 Espressif Systems (Shanghai) CO LTD
 *
 * SPDX-License-Identifier: CC0-1.0
 */

#include <stdio.h>
#include <inttypes.h>
#include "sdkconfig.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_chip_info.h"
#include "esp_flash.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_err.h"

#include "esp_vfs_semihost.h"
#include "esp_vfs_fat.h"
#include "esp_spiffs.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_event.h"
#include "mdns.h"
#include "lwip/apps/netbiosns.h"

#include <stdlib.h>
#include <string.h>
#include "spi_flash_mmap.h"
#include <esp_http_server.h>

#include "driver/i2c_master.h"
#include <esp_timer.h>

#include "web_server.h"
#include "wifi_ap.h"
#include "spiffs_init.h"
#include "esp_wifi.h"
#include <esp_flash_partitions.h>
#include "esp_ota_ops.h"
#include "spiffs_init.h"
#include "lib_pid.h"
#include "ke_config.h"
#include "stm_flash.h"
#include "png.h"
#include "stm32_uart.h"

#define UI_HOR_RES    800
#define UI_VER_RES    165

#define CAN_STBY_GPIO GPIO_NUM_40
#define STM32_RESET_PIN GPIO_NUM_2
#define STM32_BOOT_PIN GPIO_NUM_8
#define STM32_RESET_DELAY_MS 25

#define I2C_MASTER_PORT I2C_NUM_0
#define ENABLE_I2C_TEST_TX 0
#define ENABLE_SPI_TEST_TX 0
uint8_t count = 0;

#define SPI_HOST       SPI2_HOST  // HSPI or SPI2 on S3
#define DMA_CHAN       SPI_DMA_CH_AUTO
#define PIN_NUM_MISO   12
#define PIN_NUM_MOSI   13
#define PIN_NUM_CLK    14
#define PIN_NUM_CS     -1
#define SPI_BUFFER_SIZE    32 * 1000
uint8_t spi_buffer[SPI_BUFFER_SIZE] = {0};

spi_device_handle_t spi;

#define EEPROM_READ_DELAY_MS 1
#define EEPROM_WRITE_RETRY_COUNT 5
#define EEPROM_WRITE_DELAY_MS 1
#define EEPROM_ADDRESS_SIZE 2

i2c_master_dev_handle_t eeprom_handle;

static const char *TAG = "Main";

void gpio_init(void)
{
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << CAN_STBY_GPIO) | (1ULL << STM32_RESET_PIN) | (1ULL << STM32_BOOT_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE};
    gpio_config(&io_conf);
}

void stm32_reset(void)
{
    // Reset the STM32 (Inverse logic - connected to NFET)
    gpio_set_level(STM32_RESET_PIN, 1);
    ESP_LOGI(TAG, "Resetting STM32");

    // Enable the STM32 boots to application code
    gpio_set_level(STM32_BOOT_PIN, 0);
    ESP_LOGI(TAG, "Resetting STM32 BOOT0");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));

    // Release the STM32 from reset
    gpio_set_level(STM32_RESET_PIN, 0);
    ESP_LOGI(TAG, "Starting STM32");
}

void stm32_bootloader(void)
{
    // Reset the STM32 (Inverse logic - connected to NFET)
    gpio_set_level(STM32_RESET_PIN, 1);
    ESP_LOGI(TAG, "Resetting STM32");

    // Enable the STM32 to boot to the bootloader
    gpio_set_level(STM32_BOOT_PIN, 1);
    ESP_LOGI(TAG, "Setting STM32 BOOT0");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));

    // Release the STM32 from reset
    gpio_set_level(STM32_RESET_PIN, 0);
    ESP_LOGI(TAG, "Starting STM32");
}

void i2c_master_init()
{
    i2c_master_bus_config_t i2c_bus_config = {
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .i2c_port = -1,
        .scl_io_num = CONFIG_ESP32_STM32_SCL_IO,
        .sda_io_num = CONFIG_ESP32_STM32_SDA_IO,
        .flags.enable_internal_pullup = 1,
        .glitch_ignore_cnt = 7,
    };

    i2c_master_bus_handle_t bus_handle;
    ESP_ERROR_CHECK(i2c_new_master_bus(&i2c_bus_config, &bus_handle));

    // Configure the I2C EEPROM slave device
    i2c_device_config_t eeprom_cfg = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address = CONFIG_STM32_7BIT_ADDR,
        .scl_speed_hz = 100000,
    };

    ESP_ERROR_CHECK(i2c_master_bus_add_device(bus_handle, &eeprom_cfg, &eeprom_handle));
    ESP_LOGI(TAG, "Created I2C EEPROM slave device");

    // Delay to I2C is ready
    vTaskDelay(pdMS_TO_TICKS(EEPROM_READ_DELAY_MS));
}

void spi_master_init()
{
    // Configuration for the SPI bus
    spi_bus_config_t buscfg = {
        .mosi_io_num = PIN_NUM_MOSI,
        .miso_io_num = PIN_NUM_MISO,
        .sclk_io_num = PIN_NUM_CLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = SPI_BUFFER_SIZE
    };

    // Initialize the SPI bus
    ESP_ERROR_CHECK(spi_bus_initialize(SPI_HOST, &buscfg, DMA_CHAN));

    // Device configuration
    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 10 * 1000 * 1000,  // 10 MHz
        .mode = 0,
        .spics_io_num = PIN_NUM_CS,
        .queue_size = 1,
        .flags = SPI_DEVICE_NO_DUMMY,
    };

    ESP_ERROR_CHECK(spi_bus_add_device(SPI_HOST, &devcfg, &spi));
}

void init_webapp_ap(void)
{
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize SPIFFS
    init_spiffs();

    ESP_LOGI(TAG, "Listing files in SPIFFS:");
    list_spiffs_files();
    ESP_LOGI(TAG, "Listing files in SPIFFS done");

    // Initialize Wi-Fi Access Point
    wifi_init_softap();

    // Start the Web Server
    start_webserver();

    ESP_LOGI(TAG, "Application started successfully");
}

// Helper function to encode the address into the write buffer
static void encode_address(uint16_t bAdd, uint8_t *wbuf)
{
    wbuf[0] = bAdd & 0xFF;        // Lower byte
    wbuf[1] = (bAdd >> 8) & 0xFF; // Upper byte
}

// Function to read data from EEPROM
uint8_t eeprom_read(uint16_t bAdd)
{
    uint8_t wbuf[EEPROM_ADDRESS_SIZE]; // Write buffer
    uint8_t rbuf[1];                   // Read buffer

    // Encode address into the buffer
    encode_address(bAdd, wbuf);

    // Optionally log the read value (uncomment for debugging)
    ESP_LOGI(TAG, "EEPROM Begin Read at Address: %u", bAdd);

    // Perform I2C read operation
    ESP_ERROR_CHECK(i2c_master_transmit_receive(eeprom_handle, wbuf, sizeof(wbuf), rbuf, sizeof(rbuf), -1));

    // Delay to ensure EEPROM read cycle has completed
    vTaskDelay(pdMS_TO_TICKS(EEPROM_READ_DELAY_MS));

    // Optionally log the read value (uncomment for debugging)
    ESP_LOGI(TAG, "EEPROM Read: %u at Address: %u", rbuf[0], bAdd);

    return rbuf[0];
}

// Function to write data to EEPROM with retries
void eeprom_write(uint16_t bAdd, uint8_t bData)
{
    uint8_t wbuf[EEPROM_ADDRESS_SIZE + 1]; // Write buffer (address + data)

    // Encode address into the buffer
    encode_address(bAdd, wbuf);
    wbuf[2] = bData; // Set the data byte

    // Retry logic for I2C transmission
    for (uint8_t i = 0; i < EEPROM_WRITE_RETRY_COUNT; i++)
    {
        // Perform I2C write operation
        if (ESP_ERROR_CHECK_WITHOUT_ABORT(i2c_master_transmit(eeprom_handle, wbuf, sizeof(wbuf), -1)) == ESP_OK)
        {
            break; // Exit loop on success
        }
        else
        {
            // Wait before retrying
            vTaskDelay(pdMS_TO_TICKS(EEPROM_WRITE_DELAY_MS));
        }
    }

    // Additional delay to ensure EEPROM write completion
    vTaskDelay(pdMS_TO_TICKS(EEPROM_WRITE_DELAY_MS));
}

void spi_master_transmit_payload(void)
{
    // Setup SPI transaction
    spi_transaction_t t = {
        .length = sizeof(spi_buffer) * 8,  // In bits
        .tx_buffer = spi_buffer
    };

    for (int i = 0; i < sizeof(spi_buffer); i++) {
        spi_buffer[i] = i % 256;
    }

    // Transmit the buffer
    ESP_ERROR_CHECK(spi_device_transmit(spi, &t));
}

uint8_t* decode_png_to_rgba(const char *filename, int *out_width, int *out_height) {
    FILE *fp = fopen(filename, "rb");
    if (!fp) {
        ESP_LOGE(TAG, "Failed to open file: %s", filename);
        return NULL;
    }

    png_byte header[8];
    fread(header, 1, 8, fp);
    if (png_sig_cmp(header, 0, 8)) {
        ESP_LOGE(TAG, "Not a PNG file");
        fclose(fp);
        return NULL;
    }

    png_structp png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png_ptr) {
        fclose(fp);
        ESP_LOGE(TAG, "Failed to create png read struct");
        return NULL;
    }

    png_infop info_ptr = png_create_info_struct(png_ptr);
    if (!info_ptr) {
        png_destroy_read_struct(&png_ptr, NULL, NULL);
        fclose(fp);
        ESP_LOGE(TAG, "Failed to create png info struct");
        return NULL;
    }

    if (setjmp(png_jmpbuf(png_ptr))) {
        ESP_LOGE(TAG, "PNG error during init_io");
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        fclose(fp);
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
    png_bytep *row_pointers = malloc(sizeof(png_bytep) * height);
    uint8_t *image_data = malloc(height * rowbytes);

    if (!image_data || !row_pointers) {
        ESP_LOGE(TAG, "Memory allocation failed");
        fclose(fp);
        png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
        free(image_data);
        free(row_pointers);
        return NULL;
    }

    for (int y = 0; y < height; y++) {
        row_pointers[y] = image_data + y * rowbytes;
    }

    png_read_image(png_ptr, row_pointers);

    // Optional: log first few pixels
    for (int i = 0; i < 10 && i < width * height; i++) {
        uint8_t *p = image_data + i * 4;
        ESP_LOGI(TAG, "Pixel[%d] RGBA: %d %d %d %d", i, p[0], p[1], p[2], p[3]);
    }

    png_destroy_read_struct(&png_ptr, &info_ptr, NULL);
    fclose(fp);
    free(row_pointers);

    *out_width = width;
    *out_height = height;
    return image_data;
}

void spoof_config(void)
{
	// View 0
	set_view_enable(0, VIEW_STATE_ENABLED, false);
	set_view_num_gauges(0, 3, false);
	set_view_background(0, VIEW_BACKGROUND_USER1, false);
	set_view_gauge_theme(0, 0, GAUGE_THEME_STOCK_ST, false);
	set_view_gauge_theme(0, 1, GAUGE_THEME_GRUMPY_CAT, false);
	set_view_gauge_theme(0, 2, GAUGE_THEME_STOCK_ST, false);
	set_view_gauge_pid(0, 0, MODE1_ENGINE_SPEED_UUID, 0);
	set_view_gauge_units(0, 0, PID_UNITS_RPM, 0);
	set_view_gauge_pid(0, 1, MODE1_TURBOCHARGER_COMPRESSOR_INLET_PRESSURE_UUID, 0);
	set_view_gauge_units(0, 1, PID_UNITS_PSI, 0);
	set_view_gauge_pid(0, 2, MODE1_ENGINE_COOLANT_TEMPERATURE_UUID, 0);
	set_view_gauge_units(0, 2, PID_UNITS_FAHRENHEIT, 0);

	// View 1
	set_view_enable(1, VIEW_STATE_ENABLED, false);
	set_view_num_gauges(1, 1, false);
	set_view_background(1, VIEW_BACKGROUND_USER1, false);
	set_view_gauge_theme(1, 0, GAUGE_THEME_STOCK_ST, false);
	set_view_gauge_pid(1, 0, MODE1_ENGINE_SPEED_UUID, 0);
	set_view_gauge_units(1, 0, PID_UNITS_RPM, 0);

	// Dynamic
	set_dynamic_enable(0, DYNAMIC_STATE_ENABLED, false);
	set_dynamic_pid(0, MODE1_ENGINE_SPEED_UUID, false);
	set_dynamic_priority(0, DYNAMIC_PRIORITY_HIGH, false);
	set_dynamic_compare(0, DYNAMIC_COMPARISON_GREATER_THAN, false);
	set_dynamic_threshold(0, 5000, false);
	set_dynamic_index(0, 1, false);
}

void initTask(void)
{
    initGPIO();
    //initSPIFFS();
}

void app_main(void)
{
    gpio_init();
    uart_init();

    i2c_master_init();
    spi_master_init();

    // Attach EEPROM read and write handlers
    settings_setReadHandler(eeprom_read);
    settings_setWriteHandler(eeprom_write);

    //load_settings(); // Comment out for now - This will cause an I2C bootloop if the slave doesn't respond
    ESP_LOGI(TAG, "Settings loaded");

    // Disable CAN Bus
    gpio_set_level(CAN_STBY_GPIO, 1);

    init_webapp_ap();

    /* Mark current app as valid */
    const esp_partition_t *partition = esp_ota_get_running_partition();
    printf("Currently running partition: %s\r\n", partition->label);

    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(partition, &ota_state) == ESP_OK)
    {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY)
        {
            esp_ota_mark_app_valid_cancel_rollback();
        }
    }

    //stm32_bootloader();
    //stm32_reset();
    /*
    ESP_LOGI(TAG, "Starting flashing procedure...");
    initTask();
    flashSTM("digitaldash-firmware-gen2-stm32u5g.bin");
    endConn();
    */

    // Disable WIFI Power Save to allow max throughput
    esp_wifi_set_ps(WIFI_PS_NONE);

    int png_width = 0;
    int png_height = 0;
    int png_size = 0;
    uint8_t *rgba = decode_png_to_rgba("/spiffs/gauge125.png", &png_width, &png_height);

    png_size = png_width * png_height * 4;

    uart_write_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER, &png_size, 1);

    if (rgba) {
        for (int i = 0; i < png_width * png_height * 4; i++) {
            uint8_t byte = rgba[i];
        
            uart_write_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER, &byte, 1);

            uint8_t data = 0;
            const int rxBytes = uart_read_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER, &data, 1, 1000 / portTICK_PERIOD_MS);
            if (rxBytes > 0 && data == byte)
            {
                //logI(TAG, "%s", "Flash Success");
            }
            else
            {
                //logE(TAG, "%s", "Flash Failure");
            }
        }

        free(rgba); // Don't forget to free later
    }

    while (1)
    {
        // Add delay to not trigger watchdog
        vTaskDelay(pdMS_TO_TICKS(10));
        if (count > 100)
        {
            #if ENABLE_SPI_TEST_TX
            spi_master_transmit_payload();
            #endif
            #if ENABLE_I2C_TEST_TX
            i2c_master_transmit_payload();
            #endif
            count = 0;
        }
        count++;
    }
}
