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
#include "driver/i2c.h"

#define CAN_STBY_GPIO GPIO_NUM_40 // GPIO40

#define I2C_MASTER_SCL_IO 17      // GPIO for SCL
#define I2C_MASTER_SDA_IO 16      // GPIO for SDA
#define I2C_MASTER_FREQ_HZ 100000 // 100kHz
#define I2C_MASTER_PORT I2C_NUM_0
#define I2C_SLAVE_ADDR 0x2A
#define I2C_TX_BUF_DISABLE 0
#define I2C_RX_BUF_DISABLE 0
uint8_t count = 0;

static const char *TAG = "Main";

void gpio_init(void)
{
    // Configure GPIO40 as an output
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << CAN_STBY_GPIO),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE};
    gpio_config(&io_conf);
}

void i2c_master_init()
{
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ};
    i2c_param_config(I2C_MASTER_PORT, &conf);
    i2c_driver_install(I2C_MASTER_PORT, conf.mode, I2C_TX_BUF_DISABLE, I2C_RX_BUF_DISABLE, 0);
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

void i2c_master_transmit_payload(void)
{
    uint8_t payload[4] = {0xAA, 0xBB, 0xCC, 0xDD};
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (I2C_SLAVE_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write(cmd, payload, sizeof(payload), true);
    i2c_master_stop(cmd);

    esp_err_t ret = i2c_master_cmd_begin(I2C_MASTER_PORT, cmd, pdMS_TO_TICKS(100));
    i2c_cmd_link_delete(cmd);

    if (ret == ESP_OK)
    {
        printf("I2C transmission successful\n");
    }
    else
    {
        printf("I2C transmission failed\n");
    }
}

void app_main(void)
{
    gpio_init();

    i2c_master_init();

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

    // Disable WIFI Power Save to allow max throughput
    esp_wifi_set_ps(WIFI_PS_NONE);

    while (1)
    {
        // Add delay to not trigger watchdog
        vTaskDelay(pdMS_TO_TICKS(10));
        if (count > 100)
        {
            i2c_master_transmit_payload();
            count = 0;
        }
        count++;
    }
}
