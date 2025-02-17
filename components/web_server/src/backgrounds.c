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
 * The above copyright notice and this permission notice shall be included in
 *all copies or substantial portions of the Software.
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

#include "BACKGROUNDS.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "sys/dirent.h"
#include <stdlib.h>
#include <time.h>

static const char *TAG = "BackgroundRoutes";

#define MAX_RESPONSE_SIZE 1024 // Adjust as needed

esp_err_t background_get_handler(httpd_req_t *req)
{
    char response[MAX_RESPONSE_SIZE];
    int len = snprintf(response, sizeof(response), "{");

    const char *background_dir = "/spiffs/data/backgrounds";
    DIR *dir = opendir(background_dir);
    if (!dir)
    {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR,
                            "Failed to open SPIFFS background directory");
        return ESP_FAIL;
    }

    struct dirent *entry;
    int first = 1;

    while ((entry = readdir(dir)) != NULL)
    {
        if (strstr(entry->d_name, ".png.gz")) // Only include .png.gz files
        {
            if (!first)
            {
                len += snprintf(response + len, sizeof(response) - len, ",");
            }
            len += snprintf(response + len, sizeof(response) - len,
                            "\"%s\": {\"url\": \"/backgrounds/%s\", \"size\": 0, \"type\": \"image/png\", \"lastModified\": %lld}",
                            entry->d_name, entry->d_name, (long long)time(NULL));
            first = 0;
        }
    }
    closedir(dir);

    snprintf(response + len, sizeof(response) - len, "}");

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, response, strlen(response));
    return ESP_OK;
}

esp_err_t background_upload_handler(httpd_req_t *req)
{
    char filename[64];
    char query[128];

    // Expect URL like: /api/backgrounds?filename=dog.png
    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK)
    {
        if (httpd_query_key_value(query, "filename", filename, sizeof(filename)) != ESP_OK)
        {
            httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename parameter");
            return ESP_FAIL;
        }
    }
    else
    {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing query parameters");
        return ESP_FAIL;
    }

    // Build the file path for SPIFFS
    char filepath[128];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/backgrounds/%s", filename);
    ESP_LOGI(TAG, "Uploading file to: %s", filepath);

    // Open the file for writing (binary mode)
    FILE *file = fopen(filepath, "wb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for writing");
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open file");
        return ESP_FAIL;
    }

    char buffer[512];
    int received = 0;
    while ((received = httpd_req_recv(req, buffer, sizeof(buffer))) > 0)
    {
        fwrite(buffer, 1, received, file);
    }
    fclose(file);

    httpd_resp_sendstr(req, "File uploaded successfully");
    return ESP_OK;
}

esp_err_t background_delete_handler(httpd_req_t *req)
{
    char filename[64];
    char query[128];

    // Expect URL like: /api/backgrounds?filename=dog.png
    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK)
    {
        if (httpd_query_key_value(query, "filename", filename, sizeof(filename)) != ESP_OK)
        {
            httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename parameter");
            return ESP_FAIL;
        }
    }
    else
    {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing query parameters");
        return ESP_FAIL;
    }

    // Build the file path
    char filepath[128];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/backgrounds/%s", filename);
    ESP_LOGI(TAG, "Deleting file: %s", filepath);

    if (remove(filepath) == 0)
    {
        httpd_resp_sendstr(req, "File deleted successfully");
        return ESP_OK;
    }
    else
    {
        ESP_LOGE(TAG, "Failed to delete file: %s", filepath);
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to delete file");
        return ESP_FAIL;
    }
}

/* Helper function to register background routes */
esp_err_t register_backgrounds(httpd_handle_t server)
{
    esp_err_t ret;

    // Register GET /backgrounds
    httpd_uri_t background_get_uri = {.uri = "/api/backgrounds",
                                      .method = HTTP_GET,
                                      .handler = background_get_handler,
                                      .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &background_get_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background GET handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    // Register POST /backgrounds
    httpd_uri_t background_post_uri = {.uri = "/api/backgrounds",
                                       .method = HTTP_POST,
                                       .handler = background_post_handler,
                                       .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &background_post_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background POST handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    // Register DELETE /backgrounds
    httpd_uri_t background_delete_uri = {.uri = "/api/backgrounds",
                                         .method = HTTP_DELETE,
                                         .handler = background_delete_handler,
                                         .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &background_delete_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background DELETE handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "Background routes registered successfully");
    return ESP_OK;
}
