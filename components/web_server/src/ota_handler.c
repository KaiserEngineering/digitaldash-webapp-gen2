#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_http_server.h"
#include "stm32_uart.h"
#include "ota_handler.h"
#include "stm_flash.h"

static const char *TAG = "OTAHandler";

/* Error response helper specific to OTA handlers */
static void send_error_response(httpd_req_t *req, const char *status,
                                const char *error_message, const char *log_message)
{
    ESP_LOGE(TAG, "%s", log_message);
    httpd_resp_set_status(req, status);
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response), "{\"error\": \"%s\"}", error_message);
    httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}

/* OTA file upload handler */
esp_err_t web_update_post_handler(httpd_req_t *req)
{
    char buf[1000];
    esp_ota_handle_t ota_handle;
    int remaining = req->content_len;

    const esp_partition_t *ota_partition = esp_ota_get_next_update_partition(NULL);
    if (!ota_partition)
    {
        send_error_response(req, "500 Internal Server Error", "Failed to get OTA partition",
                            "OTA partition retrieval failed");
        return ESP_FAIL;
    }

    if (esp_ota_begin(ota_partition, OTA_SIZE_UNKNOWN, &ota_handle) != ESP_OK)
    {
        send_error_response(req, "500 Internal Server Error", "OTA begin failed",
                            "OTA begin operation failed");
        return ESP_FAIL;
    }

    while (remaining > 0)
    {
        int recv_len = httpd_req_recv(req, buf, remaining < sizeof(buf) ? remaining : sizeof(buf));
        if (recv_len == HTTPD_SOCK_ERR_TIMEOUT)
        {
            continue;
        }
        else if (recv_len <= 0)
        {
            send_error_response(req, "500 Internal Server Error", "Protocol error during OTA",
                                "HTTP receive error during OTA");
            esp_ota_end(ota_handle);
            return ESP_FAIL;
        }

        if (esp_ota_write(ota_handle, (const void *)buf, recv_len) != ESP_OK)
        {
            send_error_response(req, "500 Internal Server Error", "Flash error during OTA",
                                "OTA write operation failed");
            esp_ota_end(ota_handle);
            return ESP_FAIL;
        }

        remaining -= recv_len;
    }

    if (esp_ota_end(ota_handle) != ESP_OK ||
        esp_ota_set_boot_partition(ota_partition) != ESP_OK)
    {
        send_error_response(req, "500 Internal Server Error", "Validation or activation error",
                            "OTA end or boot partition activation failed");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"message\": \"STM32 firmware update complete, rebooting now!\"}");
    vTaskDelay(500 / portTICK_PERIOD_MS);
    esp_restart();
    return ESP_OK;
}

#define BINARY_CHUNK_SIZE 32768
static uint8_t *binary_chunk = NULL;
static size_t current_chunk_len = 0;
static size_t current_offset = 0;

void log_flash_chunk(uint8_t *data, uint32_t size, uint32_t start_addr)
{
    for (uint32_t offset = 0; offset < size; offset += 16)
    {
        uint32_t row_addr = start_addr + offset;
        printf("0x%08X: ", (unsigned)row_addr);

        // print 16 bytes in 4 words (little-endian per word)
        for (int word = 0; word < 4; word++)
        {
            uint32_t i = offset + word * 4;
            if (i + 3 < size)
            {
                // swap bytes to match STM32CubeProgrammer 32-bit word view
                printf("%02X %02X %02X %02X ", data[i + 3], data[i + 2], data[i + 1], data[i]);
            }
            else
            {
                // handle last incomplete row
                for (int j = 3; j >= 0; j--)
                {
                    if (i + j < size)
                        printf("%02X ", data[i + j]);
                    else
                        printf("   "); // pad
                }
            }
        }

        printf("\n");
    }
}

/* Called by KE library when it needs the current chunk data */
uint32_t get_binary_chunk_data(char *buffer, uint32_t buffer_size)
{
    if (!buffer)
    {
        ESP_LOGE(TAG, "Null buffer pointer");
        return 0;
    }

    if (current_chunk_len > buffer_size)
    {
        ESP_LOGE(TAG, "Binary chunk buffer too small (needed=%u, got=%u)",
                 (unsigned)current_chunk_len, (unsigned)buffer_size);
        return 0;
    }

    memcpy(buffer, binary_chunk, current_chunk_len);

    // log_flash_chunk(binary_chunk, current_chunk_len, 0x08010000 + current_offset);

    return (uint32_t)current_chunk_len;
}

/* STM32 firmware flashing using the custom bootloader */
void flash_stm32_firmware_task(void *pvParameter)
{
    const char *firmware_path = (const char *)pvParameter;

    char file_path[FILE_PATH_MAX];
    sprintf(file_path, "%s%s", BASE_PATH, firmware_path);
    logD(TAG, "File name: %s", file_path);

    // Open firmware file from SPIFFS
    FILE *file = fopen(file_path, "rb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open firmware file: %s", file_path);
        vTaskDelete(NULL);
        return;
    }

    if (!binary_chunk)
    {
        binary_chunk = (uint8_t *)malloc(BINARY_CHUNK_SIZE);
        if (!binary_chunk)
        {
            ESP_LOGE(TAG, "Failed to allocate binary_chunk buffer");
            fclose(file);
            vTaskDelete(NULL);
            return;
        }
    }

    size_t read_len = 0;
    int chunk_num = 0;
    bool success = true;

    current_offset = 0;

    // Enter bootloader mode
    Generate_TX_Message(get_stm32_comm(), KE_ENTER_BOOTLOADER, NULL);
    KE_wait_for_response(get_stm32_comm(), 5000);

    while ((read_len = fread(binary_chunk, 1, BINARY_CHUNK_SIZE, file)) > 0)
    {
        current_chunk_len = read_len;

        ESP_LOGI(TAG, "Sending chunk %d at offset %d", chunk_num++, current_offset);

        // Send chunk (KE lib will internally call get_binary_chunk_data)
        Generate_TX_Message(get_stm32_comm(), KE_BINARY_SEND_CHUNK, &current_offset);

        // Wait for ACK from STM32
        KE_wait_for_response(get_stm32_comm(), 20000);

        current_offset += read_len;
    }

    fclose(file);

    if (success)
    {
        ESP_LOGI(TAG, "STM32 firmware flashed successfully (%lu bytes)", (unsigned long)current_offset);
        stm32_reset();
        ESP_LOGI(TAG, "STM32 reset to run new firmware");
    }
    else
    {
        ESP_LOGE(TAG, "STM32 firmware flash failed");
    }

    vTaskDelete(NULL);
}

/* STM32 firmware flashing using the built in bootloader */
void flash_stm32_built_in_firmware_task(void *pvParameter)
{
    const char *firmware_path = (const char *)pvParameter;
    ESP_LOGI(TAG, "Starting STM32 firmware flash task: %s", firmware_path);

    // Switch UART to bootloader mode
    uart_init_for_stm32_bootloader();
    ESP_LOGI(TAG, "UART initialized for STM32 bootloader");

    // Put STM32 in bootloader mode
    stm32_bootloader();
    ESP_LOGI(TAG, "STM32 set to bootloader mode");

    // Flash the firmware using existing function
    esp_err_t result = flashSTM(firmware_path);
    if (result == ESP_OK)
    {
        ESP_LOGI(TAG, "STM32 firmware flashed successfully");
    }
    else
    {
        ESP_LOGE(TAG, "STM32 firmware flash failed");
    }

    // Reset STM32 to run new firmware
    stm32_reset();
    ESP_LOGI(TAG, "STM32 reset to run new firmware");

    // Delete this task
    vTaskDelete(NULL);
}

/* STM32 firmware flashing function */
void flash_stm32_firmware(const char *firmware_path)
{
    // Create a copy of the firmware path string for the task
    static char firmware_path_copy[64];
    strncpy(firmware_path_copy, firmware_path, sizeof(firmware_path_copy) - 1);
    firmware_path_copy[sizeof(firmware_path_copy) - 1] = '\0';

    // Create a task to run the flash operation in background
    BaseType_t result = xTaskCreate(
        flash_stm32_firmware_task,  // Task function
        "stm_flash_task",           // Task name
        8192,                       // Stack size
        (void *)firmware_path_copy, // Parameters
        5,                          // Priority
        NULL                        // Task handle
    );

    if (result != pdPASS)
    {
        ESP_LOGE(TAG, "Failed to create STM32 flash task");
        set_stm_flash_error("Failed to start flash task");
    }
}

// Add STM firmware update handler
esp_err_t stm_update_post_handler(httpd_req_t *req)
{
    flash_stm32_firmware("digitaldash-firmware-gen2-stm32u5g.bin");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"message\": \"STM32 firmware update started\"}");
    return ESP_OK;
}

// STM flash progress handler
esp_err_t stm_flash_progress_handler(httpd_req_t *req)
{
    stm_flash_progress_t *progress = get_stm_flash_progress();

    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache");

    char response[512];
    if (progress->error)
    {
        snprintf(response, sizeof(response),
                 "{\"percentage\": %d, \"message\": \"%s\", \"complete\": %s, \"error\": \"%s\"}",
                 progress->percentage,
                 progress->message,
                 progress->complete ? "true" : "false",
                 progress->error_message);
    }
    else
    {
        snprintf(response, sizeof(response),
                 "{\"percentage\": %d, \"message\": \"%s\", \"complete\": %s}",
                 progress->percentage,
                 progress->message,
                 progress->complete ? "true" : "false");
    }

    return httpd_resp_sendstr(req, response);
}

/* Register the OTA endpoint with the HTTP server */
esp_err_t register_ota_routes(httpd_handle_t server)
{
    httpd_uri_t update_post = {
        .uri = "/api/firmware/web",
        .method = HTTP_POST,
        .handler = web_update_post_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &update_post);

    httpd_uri_t stm_update_post = {
        .uri = "/api/firmware/stm",
        .method = HTTP_POST,
        .handler = stm_update_post_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &stm_update_post);

    httpd_uri_t stm_progress_get = {
        .uri = "/api/flash/progress",
        .method = HTTP_GET,
        .handler = stm_flash_progress_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &stm_progress_get);

    ESP_LOGI(TAG, "OTA routes registered successfully");
    return ESP_OK;
}
