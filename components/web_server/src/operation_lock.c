#include "operation_lock.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdio.h>
#include <string.h>

static const char *TAG = "OperationLock";

static portMUX_TYPE s_operation_mux = portMUX_INITIALIZER_UNLOCKED;
static bool s_operation_active = false;
static char s_operation_name[48] = {0};
static TickType_t s_operation_started_tick = 0;

bool web_operation_try_begin(const char *operation_name)
{
    bool started = false;

    taskENTER_CRITICAL(&s_operation_mux);
    if (!s_operation_active)
    {
        s_operation_active = true;
        s_operation_started_tick = xTaskGetTickCount();
        snprintf(s_operation_name, sizeof(s_operation_name), "%s", operation_name ? operation_name : "command");
        started = true;
    }
    taskEXIT_CRITICAL(&s_operation_mux);

    if (started)
    {
        ESP_LOGI(TAG, "Operation started: %s", operation_name);
    }

    return started;
}

void web_operation_end(void)
{
    char operation_name[sizeof(s_operation_name)] = {0};

    taskENTER_CRITICAL(&s_operation_mux);
    snprintf(operation_name, sizeof(operation_name), "%s", s_operation_name);
    s_operation_active = false;
    s_operation_name[0] = '\0';
    s_operation_started_tick = 0;
    taskEXIT_CRITICAL(&s_operation_mux);

    ESP_LOGI(TAG, "Operation finished: %s", operation_name[0] ? operation_name : "command");
}

bool web_operation_is_active(char *operation_name, size_t operation_name_size, uint32_t *elapsed_ms)
{
    bool active;
    TickType_t started_tick;

    taskENTER_CRITICAL(&s_operation_mux);
    active = s_operation_active;
    started_tick = s_operation_started_tick;
    if (operation_name && operation_name_size > 0)
    {
        snprintf(operation_name, operation_name_size, "%s", s_operation_name);
    }
    taskEXIT_CRITICAL(&s_operation_mux);

    if (elapsed_ms)
    {
        *elapsed_ms = active ? (uint32_t)((xTaskGetTickCount() - started_tick) * portTICK_PERIOD_MS) : 0;
    }

    return active;
}

esp_err_t web_operation_status_handler(httpd_req_t *req)
{
    char operation_name[sizeof(s_operation_name)] = {0};
    uint32_t elapsed_ms = 0;
    bool active = web_operation_is_active(operation_name, sizeof(operation_name), &elapsed_ms);

    char response[192];
    snprintf(response, sizeof(response),
             "{\"active\":%s,\"operation\":\"%s\",\"elapsed_ms\":%lu}",
             active ? "true" : "false",
             operation_name,
             (unsigned long)elapsed_ms);

    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache");
    return httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}

esp_err_t web_operation_send_busy(httpd_req_t *req)
{
    char operation_name[sizeof(s_operation_name)] = {0};
    uint32_t elapsed_ms = 0;
    web_operation_is_active(operation_name, sizeof(operation_name), &elapsed_ms);

    char response[224];
    snprintf(response, sizeof(response),
             "{\"success\":false,\"busy\":true,\"operation\":\"%s\",\"elapsed_ms\":%lu,"
             "\"message\":\"Another command is already in progress\"}",
             operation_name[0] ? operation_name : "command",
             (unsigned long)elapsed_ms);

    httpd_resp_set_status(req, "409 Conflict");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache");
    return httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}
