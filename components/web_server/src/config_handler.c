// config_handler.c

#include "config_handler.h"
#include "esp_log.h"
#include <sys/param.h>

static const char *TAG = "ConfigHandler";

/* CRAIG!!! READ THIS: YOU WILL NEED TO PUSH THE MCU PUSH BUTTON ON YOUR DEV UNIT EACH BOOT   */
/*                     THE VERY BASIC SETUP ONLY SENDS THE JSON ON MCU BOOT. THEREFORE IF YOU */
/*                     DON'T RESET THE MCU EACH TIME THE json_data_input BUFFER WILL BE EMPTY */
esp_err_t config_get_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, json_data_input, HTTPD_RESP_USE_STRLEN);
}

esp_err_t config_patch_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "PATCH /api/config requested");

    int total_len = req->content_len;
    char buf[2048];

    int received = httpd_req_recv(req, buf, MIN(total_len, sizeof(buf) - 1));
    if (received <= 0)
    {
        ESP_LOGE(TAG, "Failed to receive config PATCH payload");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid request");
    }

    buf[received] = '\0';
    ESP_LOGI(TAG, "Received config update: %s", buf);

    // TODO send via UART
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
        .uri = "/api/update-config",
        .method = HTTP_PATCH,
        .handler = config_patch_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &config_patch_uri);

    ESP_LOGI(TAG, "Config routes registered successfully");
    return ESP_OK;
}
