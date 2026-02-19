// config_handler.c

#include "config_handler.h"
#include "upload_utils.h"
#include "esp_log.h"
#include "lib_ke_protocol.h"
#include <sys/param.h>
#include "stm_flash.h"
#include "stm_gpio.h"

static const char *TAG = "ConfigHandler";

#define JSON_BUF_SIZE 16384  // 16KB - sufficient for typical configs (~4KB)
#define OPTION_LIST_SIZE 1200
#define PID_LIST_SIZE 10000

static char *json_data_input;
static char *json_data_output;
static char *option_list;

void get_json_data_input_info(char **ptr, uint32_t *max_len)
{
    if (ptr)
        *ptr = json_data_input;
    if (max_len)
        *max_len = JSON_BUF_SIZE;
}

void get_json_data_output_info(char **ptr, uint32_t *max_len)
{
    if (ptr)
        *ptr = json_data_output;
    if (max_len)
        *max_len = JSON_BUF_SIZE;
}

void get_option_list_info(char **ptr, uint32_t *max_len)
{
    if (ptr)
        *ptr = option_list;
    if (max_len)
        *max_len = OPTION_LIST_SIZE;
}

esp_err_t config_options_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET /api/options requested");
    
    // Check if option_list is properly initialized
    if (option_list == NULL || option_list[0] == '\0') {
        ESP_LOGW(TAG, "Options data is empty, sending empty object");
        httpd_resp_set_type(req, "application/json");
        return httpd_resp_send(req, "{}", HTTPD_RESP_USE_STRLEN);
    }
    
    ESP_LOGD(TAG, "Sending options data: %s", option_list);
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, option_list, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_get_handler(httpd_req_t *req)
{
    if(json_data_input[0] == '\0')
    {
        memset(json_data_input, '\0', JSON_BUF_SIZE);
        Generate_TX_Message(get_stm32_comm(), KE_CONFIG_REQUEST, 0);
        KE_wait_for_response(get_stm32_comm(), 5000);
    }

    ESP_LOGI(TAG, "GET /api/config requested");
    if (json_data_input[0] == '\0')
    {
        ESP_LOGE(TAG, "Config data is empty, please reset the MCU to initialize.");
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Config data not initialized");
    }
    ESP_LOGD(TAG, "Sending config data: %s", json_data_input);
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, json_data_input, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_patch_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "PATCH /api/config requested (content_len=%d, max=%d)",
             req->content_len, JSON_BUF_SIZE - 1);

    int received = 0;
    upload_result_t result = upload_to_buffer(req, json_data_output,
                                              JSON_BUF_SIZE - 1, &received, TAG);
    if (result != UPLOAD_OK)
    {
        if (result == UPLOAD_ERR_TOO_LARGE) {
            ESP_LOGE(TAG, "CONFIG BUFFER OVERFLOW: config size %d exceeds JSON_BUF_SIZE %d - increase buffer!",
                     req->content_len, JSON_BUF_SIZE);
        }
        return upload_send_result_error(req, result, TAG);
    }

    json_data_output[received] = '\0';
    ESP_LOGD(TAG, "Received config update: %s", json_data_output);

    // Now save to STM
    Generate_TX_Message(get_stm32_comm(), KE_CONFIG_SEND, 0);
    KE_wait_for_response(get_stm32_comm(), 2500);

    // The config has been changed, invalidate cached json input data
    memset(json_data_input, '\0', JSON_BUF_SIZE);

    // Brute force hot-reload. This can be done better
    vTaskDelay(pdMS_TO_TICKS(250));
    stm_gpio_splash_disable(true);
    stm32_reset();

    // Send HTTP response - always return success since we got this far
    httpd_resp_set_type(req, "application/json");
    const char* success_response = "{\"success\":true,\"message\":\"Configuration saved successfully\"}";
    ESP_LOGI(TAG, "Config saved successfully, sending success response");

    // Small delay to prevent immediate flood of requests from frontend
    vTaskDelay(100 / portTICK_PERIOD_MS);

    return httpd_resp_send(req, success_response, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_handler_init_buffer(void)
{
    ESP_LOGI(TAG, "Allocating config buffers from SPIRAM (JSON_BUF_SIZE=%d bytes each)", JSON_BUF_SIZE);

    json_data_input = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (json_data_input) {
        memset(json_data_input, '\0', JSON_BUF_SIZE);
    } else {
        ESP_LOGE(TAG, "Failed to allocate json_data_input buffer (%d bytes)", JSON_BUF_SIZE);
        return ESP_FAIL;
    }

    json_data_output = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (json_data_output) {
        memset(json_data_output, '\0', JSON_BUF_SIZE);
    } else {
        ESP_LOGE(TAG, "Failed to allocate json_data_output buffer (%d bytes)", JSON_BUF_SIZE);
        return ESP_FAIL;
    }

    option_list = heap_caps_malloc(OPTION_LIST_SIZE, MALLOC_CAP_SPIRAM);
    if (option_list) {
        memset(option_list, '\0', OPTION_LIST_SIZE);
    } else {
        ESP_LOGE(TAG, "Failed to allocate option_list buffer (%d bytes)", OPTION_LIST_SIZE);
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Config buffers allocated: %d bytes total from SPIRAM",
             (JSON_BUF_SIZE * 2) + OPTION_LIST_SIZE);
    return ESP_OK;
}

esp_err_t register_config_routes(httpd_handle_t server)
{
    httpd_uri_t config_get_uri = {
        .uri = "/api/config",
        .method = HTTP_GET,
        .handler = config_get_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_get_uri);

    httpd_uri_t config_patch_uri = {
        .uri = "/api/config",
        .method = HTTP_PATCH,
        .handler = config_patch_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_patch_uri);

    httpd_uri_t config_options_uri = {
        .uri = "/api/options",
        .method = HTTP_GET,
        .handler = config_options_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_options_uri);

    ESP_LOGI(TAG, "Config routes registered successfully");
    return ESP_OK;
}
