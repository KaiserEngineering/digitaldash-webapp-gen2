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
#include "esp_err.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "sys/stat.h"
#include "sys/dirent.h"
#include <stdlib.h>
#include <string.h>

static const char *TAG = "BackgroundRoutes";

#define MAX_PATH_SIZE 256
#define MAX_RESPONSE_SIZE 4096  // Static response buffer
#define MAX_HEADER_SIZE 512
#define MAX_FILES 100           // Maximum number of files that can be listed

// Supported image types
static const char *SUPPORTED_EXTENSIONS[] = {".png", ".jpg", ".jpeg", ".gif"};
static const char *SUPPORTED_MIME_TYPES[] = {"image/png", "image/jpeg", "image/jpeg", "image/gif"};
static const int NUM_SUPPORTED_TYPES = 4;

// Check if file is an image and get its MIME type
static bool is_image_file(const char *filename, const char **mime_type)
{
    for (int i = 0; i < NUM_SUPPORTED_TYPES; i++)
    {
        if (strcasestr(filename, SUPPORTED_EXTENSIONS[i]))
        {
            if (mime_type)
                *mime_type = SUPPORTED_MIME_TYPES[i];
            return true;
        }
    }
    return false;
}


esp_err_t list_backgrounds(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    const char *background_dir = "/spiffs";
    DIR *dir = opendir(background_dir);
    if (!dir)
    {
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open SPIFFS directory");
    }

    char response[MAX_RESPONSE_SIZE] = "{";
    size_t len = 1;  // Start after '{'
    struct dirent *entry;
    struct stat st;
    char filepath[MAX_PATH_SIZE];
    int file_count = 0;

    while ((entry = readdir(dir)) != NULL && file_count < MAX_FILES)
    {
        const char *mime_type;
        if (is_image_file(entry->d_name, &mime_type))
        {
            snprintf(filepath, sizeof(filepath), "%.200s/%.50s", background_dir, entry->d_name);
            if (stat(filepath, &st) == 0)
            {
                // Prevent buffer overflow
                if (len + 256 >= MAX_RESPONSE_SIZE - 2)
                {
                    break;  // Stop adding more files if buffer is close to full
                }

                // Add comma if not the first entry
                if (file_count > 0)
                {
                    response[len++] = ',';
                }

                len += snprintf(response + len, MAX_RESPONSE_SIZE - len,
                                "\"%s\": {\"url\": \"/api/backgrounds/%s\", \"size\": %lld, \"type\": \"%s\", \"lastModified\": %lld}",
                                entry->d_name, entry->d_name, (long long)st.st_size, mime_type, (long long)st.st_mtime);

                file_count++;
            }
        }
    }
    closedir(dir);

    response[len++] = '}';
    response[len] = '\0';  // Null terminate

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, response, len);
}


esp_err_t get_background(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    const char *prefix = "/api/background/";
    if (strncmp(req->uri, prefix, strlen(prefix)) != 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid background request");
    }

    const char *background_name = req->uri + strlen(prefix);
    const char *mime_type;
    if (!is_image_file(background_name, &mime_type))
    {
        ESP_LOGE(TAG, "Invalid file type requested: %s", background_name);
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid file type");
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/background_%s", background_name);

    FILE *file = fopen(filepath, "rb");
    if (!file)
    {
        ESP_LOGE(TAG, "File not found: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
    }

    ESP_LOGI(TAG, "Serving file: %s with MIME type: %s", filepath, mime_type);
    httpd_resp_set_type(req, mime_type);

    struct stat st;
    if (stat(filepath, &st) == 0)
    {
        char content_length[32];
        snprintf(content_length, sizeof(content_length), "%lld", (long long)st.st_size);
        httpd_resp_set_hdr(req, "Content-Length", content_length);
    }
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");

    char chunk[4096];
    size_t read_bytes;
    int total_bytes_sent = 0;

    while ((read_bytes = fread(chunk, 1, sizeof(chunk), file)) > 0)
    {
        // Log first few bytes for debugging (in hex)
        for (size_t i = 0; i < read_bytes && i < 16; i++)
        {
            printf("%02X ", (unsigned char)chunk[i]);
        }
        printf("\n");

        if (httpd_resp_send_chunk(req, chunk, read_bytes) != ESP_OK)
        {
            ESP_LOGE(TAG, "Error sending file chunk");
            fclose(file);
            return ESP_FAIL;
        }

        total_bytes_sent += read_bytes;
    }

    fclose(file);
    ESP_LOGI(TAG, "Total bytes sent: %d", total_bytes_sent);

    return httpd_resp_send_chunk(req, NULL, 0); // End response
}

esp_err_t background_delete_handler(httpd_req_t *req)
{
    char filename[64];
    char query[128];

    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK &&
        httpd_query_key_value(query, "filename", filename, sizeof(filename)) == ESP_OK)
    {
        char filepath[MAX_PATH_SIZE];
        snprintf(filepath, sizeof(filepath), "/spiffs/data/backgrounds/%s", filename);

        if (remove(filepath) == 0)
        {
            return httpd_resp_sendstr(req, "File deleted successfully");
        }
    }

    return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid request or file not found");
}


esp_err_t register_backgrounds(httpd_handle_t server)
{
    httpd_uri_t background_get_uri = {
        .uri = "/api/background/*",
        .method = HTTP_GET,
        .handler = get_background,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &background_get_uri);

    httpd_uri_t backgrounds_get_uri = {
        .uri = "/api/backgrounds",
        .method = HTTP_GET,
        .handler = list_backgrounds,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &backgrounds_get_uri);

    httpd_uri_t background_delete_uri = {
        .uri = "/api/backgrounds",
        .method = HTTP_DELETE,
        .handler = background_delete_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &background_delete_uri);

    ESP_LOGI(TAG, "Background routes registered successfully");
    return ESP_OK;
}
