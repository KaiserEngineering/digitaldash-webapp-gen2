// config_handler.c

#include "config_handler.h"
#include "esp_log.h"
#include "lib_ke_protocol.h"
#include <sys/param.h>
#include "stm_flash.h"

static const char *TAG = "ConfigHandler";

#define JSON_BUF_SIZE 60000
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
    
    ESP_LOGI(TAG, "Sending options data: %s", option_list);
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, option_list, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_get_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET /api/config requested");
    if (json_data_input[0] == '\0')
    {
        ESP_LOGE(TAG, "Config data is empty, please reset the MCU to initialize.");
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Config data not initialized");
    }
    ESP_LOGI(TAG, "Sending config data: %s", json_data_input);
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, json_data_input, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_patch_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "PATCH /api/config requested");

    int total_len = req->content_len;

    int received = httpd_req_recv(req, json_data_output, MIN(total_len, JSON_BUF_SIZE));
    if (received <= 0)
    {
        ESP_LOGE(TAG, "Failed to receive config PATCH payload");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid request");
    }

    json_data_output[received] = '\0';
    ESP_LOGI(TAG, "Received config update: %s", json_data_output);

    // Now save to STM
    Generate_TX_Message(get_stm32_comm(), KE_CONFIG_SEND, 0);
    KE_wait_for_response(get_stm32_comm(), 5000);

    // Brute force hot-reload. This can be done better
    vTaskDelay(pdMS_TO_TICKS(250));
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
    json_data_input = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    json_data_output = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    option_list = heap_caps_malloc(OPTION_LIST_SIZE, MALLOC_CAP_SPIRAM);
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
