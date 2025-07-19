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

/* STM32 firmware flashing function */
void flash_stm32_firmware(const char *firmware_path)
{
    ESP_LOGI(TAG, "Starting STM32 firmware flash: %s", firmware_path);

    // Switch UART to bootloader mode
    uart_init_for_stm32_bootloader();
    ESP_LOGI(TAG, "UART initialized for STM32 bootloader");

    // Put STM32 in bootloader mode
    stm32_bootloader();
    ESP_LOGI(TAG, "STM32 set to bootloader mode");

    // Flash the firmware using existing function
    esp_err_t result = flashSTM(firmware_path);
    if (result == ESP_OK) {
        ESP_LOGI(TAG, "STM32 firmware flashed successfully");
    } else {
        ESP_LOGE(TAG, "STM32 firmware flash failed");
    }

    // Reset STM32 to run new firmware
    stm32_reset();
    ESP_LOGI(TAG, "STM32 reset to run new firmware");
}

// Add STM firmware update handler
esp_err_t stm_update_post_handler(httpd_req_t *req)
{
    flash_stm32_firmware("digitaldash-firmware-gen2-stm32u5g.bin");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"message\": \"STM32 firmware update complete!\"}");
    return ESP_OK;
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

    ESP_LOGI(TAG, "OTA routes registered successfully");
    return ESP_OK;
}
