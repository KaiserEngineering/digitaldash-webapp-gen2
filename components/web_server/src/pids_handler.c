#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "esp_log.h"
#include "esp_http_server.h"
#include "pids_handler.h"

static const char *TAG = "PIDsHandler";

#define PID_LIST_SIZE 10000

static char *pid_list;

void get_pid_list_info(char **ptr, uint32_t *max_len)
{
    if (ptr)
        *ptr = pid_list;
    if (max_len)
        *max_len = PID_LIST_SIZE;
}

esp_err_t get_pids_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET /api/pids requested");
    ESP_LOGI(TAG, "Sending PID list: %s", pid_list);

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, pid_list, HTTPD_RESP_USE_STRLEN);
}

esp_err_t pids_handler_init_buffer(void)
{
    pid_list = heap_caps_malloc(PID_LIST_SIZE, MALLOC_CAP_SPIRAM);
    return ESP_OK;
}

esp_err_t register_pids_routes(httpd_handle_t server)
{
    httpd_uri_t config_pids_uri = {
        .uri = "/api/pids",
        .method = HTTP_GET,
        .handler = get_pids_handler,
        .user_ctx = NULL};
    return httpd_register_uri_handler(server, &config_pids_uri);
}
