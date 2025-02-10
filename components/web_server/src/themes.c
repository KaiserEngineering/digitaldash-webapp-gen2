/**
 ******************************************************************************
 *
 * Copyright (c) 2025 KaiserEngineering, LLC
 * Author Matthew Kaiser, Craig Kaiser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************
 */

#include "THEMES.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include <stdlib.h>

static const char *TAG = "ThemeRoutes";

/* Dummy handler for GET /theme */
esp_err_t theme_get_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"theme\": \"default\", \"message\": \"GET theme endpoint dummy response\"}");
    return ESP_OK;
}

esp_err_t theme_post_handler(httpd_req_t *req)
{
    int total_len = req->content_len;
    if(total_len <= 0){
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No data received");
        return ESP_FAIL;
    }

    // Allocate a buffer to hold the binary data.
    char *buf = malloc(total_len);
    if (!buf) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR,
                              "Memory allocation failed in theme_post_handler");
        return ESP_FAIL;
    }

    int received = 0;
    while (received < total_len) {
        int ret = httpd_req_recv(req, buf + received, total_len - received);
        if (ret <= 0) {
            free(buf);
            httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR,
                                  "HTTP request receive error in theme_post_handler");
            return ESP_FAIL;
        }
        received += ret;
    }

    ESP_LOGI(TAG, "Theme POST received binary blob, size: %d bytes", total_len);
    ESP_LOG_BUFFER_HEX(TAG, buf, total_len);

    // Here, you can process the binary data. For example, if it represents a PNG image,
    // you might save it to flash or parse it further.

    free(buf);

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"status\": \"Theme POST received\"}");
    return ESP_OK;
}

/* Dummy handler for DELETE /theme */
esp_err_t theme_delete_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"status\": \"Theme deleted\"}");
    return ESP_OK;
}

/* Helper function to register theme routes */
esp_err_t register_themes(httpd_handle_t server)
{
    esp_err_t ret;

    // Register GET /theme
    httpd_uri_t theme_get_uri = {
        .uri       = "/theme",
        .method    = HTTP_GET,
        .handler   = theme_get_handler,
        .user_ctx  = NULL
    };
    ret = httpd_register_uri_handler(server, &theme_get_uri);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register theme GET handler: %s", esp_err_to_name(ret));
        return ret;
    }

    // Register POST /theme
    httpd_uri_t theme_post_uri = {
        .uri       = "/theme",
        .method    = HTTP_POST,
        .handler   = theme_post_handler,
        .user_ctx  = NULL
    };
    ret = httpd_register_uri_handler(server, &theme_post_uri);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register theme POST handler: %s", esp_err_to_name(ret));
        return ret;
    }

    // Register DELETE /theme
    httpd_uri_t theme_delete_uri = {
        .uri       = "/theme",
        .method    = HTTP_DELETE,
        .handler   = theme_delete_handler,
        .user_ctx  = NULL
    };
    ret = httpd_register_uri_handler(server, &theme_delete_uri);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register theme DELETE handler: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "Theme routes registered successfully");
    return ESP_OK;
}
