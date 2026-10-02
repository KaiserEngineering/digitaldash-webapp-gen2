// config_handler.c

#include "config_handler.h"
#include "esp_log.h"
#include "lib_ke_protocol.h"
#include <sys/param.h>
#include "stm_flash.h"
#include "stm_gpio.h"
#include "operation_lock.h"

static const char *TAG = "ConfigHandler";

#define JSON_BUF_SIZE 60000
#define OPTION_LIST_SIZE 2500
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

// Shared body for both PATCH /api/config and its POST alias (see
// config_post_handler doc comment below for why the alias exists).
static esp_err_t config_update_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "PATCH /api/config requested");

    if (!web_operation_try_begin("configuration update"))
    {
        return web_operation_send_busy(req);
    }

    int total_len = req->content_len;
    if (total_len >= JSON_BUF_SIZE)
    {
        ESP_LOGE(TAG, "Config update payload too large (%d bytes)", total_len);
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Payload too large");
    }

    // httpd_req_recv() is a thin wrapper over recv() - it can return fewer
    // bytes than asked for if the body arrives across multiple TCP segments,
    // so a single call isn't guaranteed to capture the whole document. A
    // browser's XHR/fetch stack tends to hand this off in one shot on a fast
    // local connection, but Qt 5.6's embedded network stack (used by the
    // Sync3 companion app's QML XHR) does not, which was silently truncating
    // the JSON mid-document and forwarding garbage to the STM32 - explaining
    // saves that reset the cluster but apply nothing (or only partially).
    // Loop until the full content_len is read, per the standard ESP-IDF
    // pattern for POST bodies.
    int cur_len = 0;
    while (cur_len < total_len)
    {
        ESP_LOGE(TAG, "Failed to receive config PATCH payload");
        web_operation_end();
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid request");
    }

    json_data_output[cur_len] = '\0';
    ESP_LOGD(TAG, "Received config update: %s", json_data_output);

    // Now save to STM
    Generate_TX_Message(get_stm32_comm(), KE_CONFIG_SEND, 0);
    KE_wait_for_response(get_stm32_comm(), 5000);

    // The config has been changed, invalidate cached json input data
    memset(json_data_input, '\0', JSON_BUF_SIZE);

    // Brute force hot-reload. This can be done better
    // vTaskDelay(pdMS_TO_TICKS(250));
    // stm_gpio_splash_disable(true);
    // stm32_reset();

    // Send HTTP response - always return success since we got this far
    httpd_resp_set_type(req, "application/json");
    const char* success_response = "{\"success\":true,\"message\":\"Configuration saved successfully\"}";
    ESP_LOGI(TAG, "Config saved successfully, sending success response");

    // Small delay to prevent immediate flood of requests from frontend
    vTaskDelay(100 / portTICK_PERIOD_MS);

    esp_err_t ret = httpd_resp_send(req, success_response, HTTPD_RESP_USE_STRLEN);
    web_operation_end();
    return ret;
}

esp_err_t config_patch_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "PATCH /api/config requested");
    return config_update_handler(req);
}

// POST alias for config_patch_handler, doing an identical whole-document
// replace. Added for HTTP clients that can't dispatch a PATCH request at
// all - e.g. Qt 5.6's QML XMLHttpRequest (used by the Sync3 companion app,
// see DigitalDash_Sync3/Sync_DigitalDash), which predates PATCH support in
// QML XHR (added in Qt 5.9) and silently drops the request instead of
// sending it. Safe to remove if that constraint ever goes away - nothing
// else in this webapp depends on it.
esp_err_t config_post_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "POST /api/config requested (PATCH alias)");
    return config_update_handler(req);
}

esp_err_t config_handler_init_buffer(void)
{
    json_data_input = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (json_data_input) {
        memset(json_data_input, '\0', JSON_BUF_SIZE);
    } else {
        return ESP_FAIL;
    }

    json_data_output = heap_caps_malloc(JSON_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (json_data_output) {
        memset(json_data_output, '\0', JSON_BUF_SIZE);
    } else {
        return ESP_FAIL;
    }

    option_list = heap_caps_malloc(OPTION_LIST_SIZE, MALLOC_CAP_SPIRAM);
    if (option_list) {
        memset(option_list, '\0', OPTION_LIST_SIZE);
    } else {
        return ESP_FAIL;
    }

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

    // POST alias - see config_post_handler's doc comment above.
    httpd_uri_t config_post_uri = {
        .uri = "/api/config",
        .method = HTTP_POST,
        .handler = config_post_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_post_uri);

    httpd_uri_t config_options_uri = {
        .uri = "/api/options",
        .method = HTTP_GET,
        .handler = config_options_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_options_uri);

    ESP_LOGI(TAG, "Config routes registered successfully");
    return ESP_OK;
}
