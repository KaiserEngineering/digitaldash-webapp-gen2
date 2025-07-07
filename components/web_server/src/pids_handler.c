#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "esp_log.h"
#include "esp_http_server.h"
#include "pids_handler.h"

static const char *TAG = "PIDsHandler";

esp_err_t config_pids_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET /api/pids requested");
    ESP_LOGI(TAG, "Sending PID list: %s", pid_list);

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, pid_list, HTTPD_RESP_USE_STRLEN);
}

esp_err_t register_ota_routes(httpd_handle_t server)
{
    httpd_uri_t config_pids_uri = {
        .uri = "/api/pids",
        .method = HTTP_GET,
        .handler = config_pids_handler,
        .user_ctx = NULL};
    return httpd_register_uri_handler(server, &config_pids_uri);
}
