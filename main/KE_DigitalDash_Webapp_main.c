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

static const char *TAG = "Main";

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

void app_main(void)
{
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
    }
}
