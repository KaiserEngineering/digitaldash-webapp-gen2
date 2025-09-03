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
#include "ota_handler.h"
#include "esp_wifi.h"
#include <esp_flash_partitions.h>
#include "esp_ota_ops.h"
#include "spiffs_init.h"
#include "stm_flash.h"
#include "stm32_uart.h"
#include "png_transfer.h"
#include "lib_ke_protocol.h"
#include "cJSON.h"
#include "esp_heap_caps.h"
#include "config_handler.h"

#define UI_HOR_RES    1024
#define UI_VER_RES    200

#define CAN_STBY_GPIO GPIO_NUM_40

static const char *TAG = "Main";

uint32_t background_crc = 0;
uint8_t background_idx = 0xFF;

KE_PACKET_MANAGER stm32_comm;

void gpio_init(void)
{
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << CAN_STBY_GPIO) |
                        (1ULL << CONFIG_STM32_RESET_PIN) |
                        (1ULL << CONFIG_STM32_BOOT_PIN) |
                        (1ULL << CONFIG_STM32_SPLASH_EN_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&io_conf);
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

int stm32_tx(const uint8_t *data, uint32_t len)
{
    size_t total_sent = 0;
    size_t max_chunk_size = 0x7FFF; // 1/2 0xFFFF which is the STM32 max DMA size

    while (total_sent < len) {
        size_t chunk = len - total_sent;
        chunk = ( chunk > max_chunk_size ) ? (max_chunk_size) : chunk;
        int sent = uart_write_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER,
                                    (const char *)(data + total_sent),
                                    chunk);

        if (sent < 0) {
            ESP_LOGE("UART", "TX failed at byte %d", total_sent);
            return total_sent;  // Return bytes sent before error
        }

        // Wait for the reciever to process data. THIS IS A MUST
        vTaskDelay(25);

        total_sent += sent;
    }

    //ESP_LOGI(TAG, "Sent %d bytes to STM32", total_sent);

    return total_sent;
}


KE_PACKET_MANAGER *get_stm32_comm(void) {
    return &stm32_comm;
}

/**
 * @brief Copies the JSON configuration data into the provided buffer.
 *
 * This function safely copies the contents of `json_data_output` into
 * the given `buffer`, ensuring null termination to avoid buffer overflows
 * or unterminated strings. The function also logs the copied JSON string
 * for debugging purposes.
 *
 * @param buffer        Destination buffer where JSON data will be copied.
 * @param buffer_size   Size of the destination buffer in bytes.
 *
 * @return Number of bytes copied into the buffer (excluding null terminator).
 */
uint32_t send_config(char *buffer, uint32_t buffer_size)
{
    char *ptr;
    uint32_t len;
    get_json_data_output_info(&ptr, &len);
    strncpy(buffer, ptr, buffer_size - 1);
    buffer[buffer_size - 1] = '\0'; // ensure null termination

    ESP_LOGD("CONFIG", "JSON Config copied to buffer:\n%s", buffer);
    return strlen(buffer);
}

/**
 * @brief Receives and stores a JSON configuration string.
 *
 * Copies the provided JSON string into the internal `json_data_input` buffer,
 * ensuring that it is safely null-terminated to prevent buffer overflows.
 * The received configuration is then logged for debugging purposes.
 *
 * @param json_str  Pointer to the input JSON string.
 *
 * @return true     Always returns true to indicate the operation succeeded.
 */
bool receive_config(const char *json_str)
{
    char *ptr;
    uint32_t len;
    get_json_data_input_info(&ptr, &len);
    strncpy(ptr, json_str, len-1);
    ptr[len - 1] = '\0'; // ensure null termination

    ESP_LOGD("CONFIG", "Received JSON Config:\n%s", ptr);
    return true;
}

/**
 * @brief Receives and stores a JSON-formatted option list.
 *
 * Copies the given JSON string into the internal `option_list` buffer,
 * ensuring it is null-terminated to avoid buffer overflows. The received
 * data is then logged for debugging purposes.
 *
 * @param json_str  Pointer to the JSON string containing the option list.
 *
 * @return true     Always returns true to indicate successful receipt.
 */
bool receive_option_list(const char *json_str)
{
    char *ptr;
    uint32_t len;
    get_option_list_info(&ptr, &len);
    strncpy(ptr, json_str, len - 1);
    ptr[len - 1] = '\0'; // ensure null termination

    ESP_LOGD("CONFIG", "Received JSON Option List:\n%s", ptr);
    return true;
}

bool receive_pid_list(const char *json_str)
{
    char *ptr;
    uint32_t len;
    get_pid_list_info(&ptr, &len);
    strncpy(ptr, json_str, len - 1);
    ptr[len - 1] = '\0'; // ensure null termination

    ESP_LOGD("CONFIG", "Received JSON PID List:\n%s", ptr);
    return true;
}


uint32_t recieve_crc_from_ke(uint8_t idx, uint32_t crc)
{
    background_crc = crc;
    background_idx = idx;
    return crc;
}

uint32_t png_to_rgba(char *buffer, uint32_t buffer_size, uint8_t background_idx)
{
    int num_bytes = 0;

    char *ptr;
    uint32_t len;
    get_option_list_info(&ptr, &len);

    // Parse the JSON string
    cJSON *root = cJSON_Parse(ptr);
    if (root == NULL) {
        ESP_LOGI(TAG, "Error parsing JSON!\n");
        return num_bytes;
    }

    // Get the "view_background" array from the JSON object
    cJSON *view_background = cJSON_GetObjectItemCaseSensitive(root, "view_background");
    if (!cJSON_IsArray(view_background)) {
        ESP_LOGI(TAG, "\"view_background\" is not an array or does not exist!");
        cJSON_Delete(root);
        return num_bytes;
    }

    // Verify the background is in bounds
    if( background_idx >= cJSON_GetArraySize(view_background) ) {
        cJSON_Delete(root);
        return num_bytes;
    }

    cJSON *user = cJSON_GetArrayItem(view_background, background_idx);
    if (cJSON_IsString(user) && user->valuestring != NULL) {
        char image_name[64] = {0};
        snprintf(image_name, sizeof(image_name), "/spiffs/%s.png", user->valuestring);
        
        FILE *fp = fopen(image_name, "rb");
        if (fp) {
            ESP_LOGI(TAG, "%s raw bytes sent", image_name);
            num_bytes = decode_png_to_rgba(fp, (uint8_t*)buffer, buffer_size);
            fclose(fp);
        } else {
            ESP_LOGW(TAG, "File not found: %s", image_name);
        }
    } else {
        ESP_LOGI(TAG, "view_background[%d] is not a valid string", background_idx);
    }

    // Clean up
    cJSON_Delete(root);
    return num_bytes;
}

void mirror_spiffs(void)
{
    char *ptr;
    uint32_t len;
    get_option_list_info(&ptr, &len);

    // Parse the JSON string
    cJSON *root = cJSON_Parse(ptr);
    if (root == NULL) {
        ESP_LOGI(TAG, "Error parsing JSON!\n");
        return;
    }
    
    // Get the "view_background" array from the JSON object
    cJSON *view_background = cJSON_GetObjectItemCaseSensitive(root, "view_background");
    if (!cJSON_IsArray(view_background)) {
        ESP_LOGI(TAG, "\"view_background\" is not an array or does not exist!");
        cJSON_Delete(root);
        return;
    }
    
    int count = cJSON_GetArraySize(view_background);
    for (int i = 0; i < count; i++) {
        cJSON *user = cJSON_GetArrayItem(view_background, i);
        if (cJSON_IsString(user) && user->valuestring != NULL) {
            char image_name[64] = {0};
            snprintf(image_name, sizeof(image_name), "/spiffs/%s.png", user->valuestring);
            
            FILE *fp = fopen(image_name, "rb");
            if (fp) {
                ESP_LOGI(TAG, "File exists: %s", image_name);
                uint32_t img_crc = crc32_png_rgba(fp);
                ESP_LOGI(TAG, "ESP32 CRC: %lu", img_crc);
                Generate_TX_Message(&stm32_comm, KE_BACKGROUND_CRC_REQUEST, &i );
                KE_wait_for_response(&stm32_comm, 1000);
                ESP_LOGI(TAG, "STM32 CRC: %lu", background_crc);
                if( background_crc == img_crc ) {
                    ESP_LOGI(TAG, "Image match, skipping");
                } else {
                    Generate_TX_Message(&stm32_comm, KE_BACKGROUND_SEND, &i );
                    KE_wait_for_response(&stm32_comm, 30000);
                }
                fclose(fp);
            } else {
                ESP_LOGI(TAG, "File not found: %s", image_name);
            }
        } else {
            ESP_LOGI(TAG, "view_background[%d] is not a valid string", i);
        }
    }
    
    // Clean up
    cJSON_Delete(root);
}

void stm32_communication_init(void)
{
    stm32_comm.init.role      = KE_PRIMARY;
    stm32_comm.init.transmit  = &stm32_tx;        /* Function call to transmit UART data to the STM32 */
    stm32_comm.init.req_pid   = NULL;             /* Function call to request a PID */
    stm32_comm.init.clear_pid = NULL;             /* Function call to remove a PID */
    stm32_comm.init.cooling   = NULL;             /* Function call to request active cooling */
    stm32_comm.init.config_to_json = &send_config;
    stm32_comm.init.json_to_config = &receive_config;
    stm32_comm.init.json_to_options = &receive_option_list;
    stm32_comm.init.json_to_pid_list = &receive_pid_list;
    stm32_comm.init.receive_rgba_crc = &recieve_crc_from_ke;
    stm32_comm.init.binary_get_chunk = &get_binary_chunk_data;
    stm32_comm.init.firmware_version_major  = 1;  /* Major firmware version */
    stm32_comm.init.firmware_version_minor  = 0;  /* Minor firmware version */
    stm32_comm.init.firmware_version_hotfix = 0;  /* Hot fix firmware version */
    stm32_comm.init.png_to_rgba = &png_to_rgba;
    stm32_comm.tx_buffer_size = (UI_HOR_RES*UI_VER_RES*4)+128;
    stm32_comm.rx_buffer_size = 6000;
    stm32_comm.tx_buffer = (uint8_t *)heap_caps_malloc(stm32_comm.tx_buffer_size, MALLOC_CAP_SPIRAM);
    stm32_comm.rx_buffer = (uint8_t *)heap_caps_malloc(stm32_comm.rx_buffer_size, MALLOC_CAP_SPIRAM);
    uart_init(&stm32_comm);
}

void KE_tick_wrapper(void* arg) {
    KE_tick();
}

void start_KE_tick_timer(void) {
    const esp_timer_create_args_t timer_args = {
        .callback = &KE_tick_wrapper,
        .name = "ke_tick_timer"
    };

    esp_timer_handle_t periodic_timer;
    ESP_ERROR_CHECK(esp_timer_create(&timer_args, &periodic_timer));
    ESP_ERROR_CHECK(esp_timer_start_periodic(periodic_timer, 1000)); // 1000us = 1ms
}

void app_main(void)
{
    gpio_init();
    stm32_communication_init();

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

    start_KE_tick_timer();

    // Flash the STM32 bootloader
    flash_stm32_bootloader("STM32U5G9ZJTXQ_OSPI_Bootloader.bin");
    vTaskDelay(pdMS_TO_TICKS(1000));
    uart_init(&stm32_comm);
    // End flash the STM32 bootloader


    Generate_TX_Message(&stm32_comm, KE_CONFIG_REQUEST, 0);
    KE_wait_for_response(&stm32_comm, 1000);
    Generate_TX_Message(&stm32_comm, KE_OPTION_LIST_REQUEST, 0);
    KE_wait_for_response(&stm32_comm, 1000);
    Generate_TX_Message(&stm32_comm, KE_PID_LIST_REQUEST, 0);
    KE_wait_for_response(&stm32_comm, 1000);
    mirror_spiffs();

    while (1)
    {
        // Add delay to not trigger watchdog
        vTaskDelay(pdMS_TO_TICKS(1));
        KE_Service(&stm32_comm);
    }
}
