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
#include <time.h>
#include <string.h>

static const char *TAG = "BackgroundRoutes";

#define MAX_PATH_SIZE 512      // Increased from 128
#define MAX_RESPONSE_SIZE 2048 // Increased from 1024
#define MAX_HEADER_SIZE 512

// Add supported image types
static const char *SUPPORTED_EXTENSIONS[] = {".png", ".jpg", ".jpeg", ".gif"};
static const char *SUPPORTED_MIME_TYPES[] = {"image/png", "image/jpeg", "image/jpeg", "image/gif"};
static const int NUM_SUPPORTED_TYPES = 4;

// Helper function to check if file is an image and get its MIME type
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
    ESP_LOGI(TAG, "Listing all backgrounds");

    const char *background_dir = "/spiffs";  // SPIFFS has no directories, so files must be named accordingly
    DIR *dir = opendir(background_dir);
    if (!dir)
    {
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open SPIFFS directory");
    }

    // 🔹 Use dynamically allocated buffer to handle large responses
    size_t buffer_size = 1024; // Start with 1KB and expand if needed
    char *response = malloc(buffer_size);
    if (!response)
    {
        closedir(dir);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Out of memory");
    }

    size_t len = snprintf(response, buffer_size, "{");
    struct dirent *entry;
    int first = 1;
    struct stat st;
    char filepath[MAX_PATH_SIZE];

    while ((entry = readdir(dir)) != NULL)
    {
        const char *mime_type;
        if (is_image_file(entry->d_name, &mime_type))  // ✅ Ensure it's a valid image
        {
            snprintf(filepath, sizeof(filepath), "%s/%s", background_dir, entry->d_name);
            if (stat(filepath, &st) == 0)
            {
                // 🔹 Expand response buffer if needed
                size_t needed_space = 256; // Approximate size for this JSON entry
                if (len + needed_space >= buffer_size)
                {
                    buffer_size *= 2;  // Double buffer size
                    char *new_response = realloc(response, buffer_size);
                    if (!new_response)
                    {
                        free(response);
                        closedir(dir);
                        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Out of memory");
                    }
                    response = new_response;
                }

                // 🔹 Add comma if this is not the first entry
                len += snprintf(response + len, buffer_size - len, "%s\"%s\": {\"url\": \"/api/backgrounds/%s\", \"size\": %lld, \"type\": \"%s\", \"lastModified\": %lld}",
                                first ? "" : ",",
                                entry->d_name, entry->d_name, (long long)st.st_size, mime_type, (long long)st.st_mtime);
                first = 0;
            }
        }
    }

    closedir(dir);

    // 🔹 Ensure JSON is properly closed
    len += snprintf(response + len, buffer_size - len, "}");

    // 🔹 Send JSON response
    httpd_resp_set_type(req, "application/json");
    esp_err_t ret = httpd_resp_send(req, response, len);
    free(response);  // ✅ Free memory after sending

    return ret;
}

esp_err_t get_background(httpd_req_t *req)
{
    const char *prefix = "/api/background/";

    if (strncmp(req->uri, prefix, strlen(prefix)) == 0)
    {
        const char *background_name = req->uri + strlen(prefix); // Extract filename

        // Validate image file
        const char *mime_type;
        if (!is_image_file(background_name, &mime_type))
        {
            ESP_LOGE(TAG, "Invalid file type requested: %s", background_name);
            return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid background type");
        }

        // SPIFFS Fix: Store as `/spiffs/background_filename`
        char filepath[MAX_PATH_SIZE];
        snprintf(filepath, sizeof(filepath), "/spiffs/data/background_%s", background_name);

        if (strstr(filepath, ".gz") != NULL)
        {
            httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
        }

        FILE *file = fopen(filepath, "rb");
        if (!file)
        {
            ESP_LOGE(TAG, "File not found: %s", filepath);
            return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
        }

        // Set MIME type
        httpd_resp_set_type(req, mime_type);

        // Set Content-Length
        struct stat st;
        if (stat(filepath, &st) == 0)
        {
            char content_length[32];
            snprintf(content_length, sizeof(content_length), "%lld", (long long)st.st_size);
            httpd_resp_set_hdr(req, "Content-Length", content_length);
        }

        // ✅ Use larger chunks for better performance (e.g., 4096 bytes)
        const size_t chunk_size = 4096;
        char *chunk = malloc(chunk_size);
        if (!chunk)
        {
            fclose(file);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Out of memory");
        }

        size_t read_bytes;
        esp_err_t ret = ESP_OK;
        while ((read_bytes = fread(chunk, 1, chunk_size, file)) > 0)
        {
            ESP_LOGI(TAG, "Read %zu bytes from file", read_bytes);
            ret = httpd_resp_send_chunk(req, chunk, read_bytes);
            if (ret != ESP_OK)
            {
                ESP_LOGE(TAG, "File sending failed: %s", esp_err_to_name(ret));
                break;
            }

            // Yield to the OS **only if** we're sending a large amount of data
            if (read_bytes >= 2048)
            {
                vTaskDelay(1 / portTICK_PERIOD_MS);
            }
        }

        free(chunk);
        fclose(file);

        // End response if everything was sent successfully
        if (ret == ESP_OK)
        {
            ret = httpd_resp_send_chunk(req, NULL, 0);
        }

        ESP_LOGI(TAG, "File sent successfully: %s", filepath);
        return ret;
    }

    return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid background request");
}

esp_err_t background_upload_handler(httpd_req_t *req)
{
    // Get the content length of the request
    int total_len = req->content_len;
    ESP_LOGI(TAG, "Content length: %d", total_len);

    // Get filename from FormData
    char *boundary = NULL;
    char *content_type = NULL;
    char header_value[MAX_HEADER_SIZE];

    if (httpd_req_get_hdr_value_str(req, "Content-Type", header_value, MAX_HEADER_SIZE) == ESP_OK)
    {
        content_type = header_value;
        // Extract boundary from Content-Type
        boundary = strstr(content_type, "boundary=");
        if (boundary)
        {
            boundary += 9; // Skip "boundary="
        }
    }

    if (!boundary)
    {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No boundary found in multipart form data");
        return ESP_FAIL;
    }

    // Read the first part of the multipart form data to get the filename
    char buf[1024]; // Increase buffer size
    int received;
    char filename[64] = {0};
    bool found_filename = false;

    while ((received = httpd_req_recv(req, buf, sizeof(buf))) > 0)
    {
        char *filename_start = strstr(buf, "filename=\"");
        if (filename_start)
        {
            filename_start += 10;
            char *filename_end = strchr(filename_start, '"');
            if (filename_end)
            {
                int name_len = filename_end - filename_start;
                if (name_len < sizeof(filename))
                {
                    strncpy(filename, filename_start, name_len);
                    filename[name_len] = '\0';

                    // Validate file type
                    const char *mime_type;
                    if (!is_image_file(filename, &mime_type))
                    {
                        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST,
                                            "Unsupported file type. Only PNG, JPG, JPEG, and GIF files are allowed.");
                        return ESP_FAIL;
                    }

                    found_filename = true;
                    break;
                }
            }
        }
    }

    if (!found_filename)
    {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No filename found in form data");
        return ESP_FAIL;
    }

    // Build the file path for SPIFFS
    char filepath[128];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/background/%s", filename);
    ESP_LOGI(TAG, "Uploading file to: %s", filepath);

    // Open the file for writing
    FILE *file = fopen(filepath, "wb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for writing");
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open file");
        return ESP_FAIL;
    }

    // Continue reading and writing the file content
    while ((received = httpd_req_recv(req, buf, sizeof(buf))) > 0)
    {
        fwrite(buf, 1, received, file);
    }
    fclose(file);

    // Send JSON response
    char response[256];
    snprintf(response, sizeof(response),
             "{\"success\": true, \"filename\": \"%s\", \"message\": \"File uploaded successfully\"}",
             filename);

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, response, strlen(response));
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

    // ✅ Register GET handler for specific file requests
    httpd_uri_t background_get_uri = {
        .uri = "/api/background/*",
        .method = HTTP_GET,
        .handler = get_background,
        .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &background_get_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background GET handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    // ✅ Register GET handler for list
    httpd_uri_t backgrounds_get_uri = {
        .uri = "/api/backgrounds",
        .method = HTTP_GET,
        .handler = list_backgrounds,
        .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &backgrounds_get_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background GET handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    // ✅ Register POST `/api/backgrounds` (for uploads)
    httpd_uri_t background_post_uri = {
        .uri = "/api/backgrounds",
        .method = HTTP_POST,
        .handler = background_upload_handler,
        .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &background_post_uri);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register background POST handler: %s",
                 esp_err_to_name(ret));
        return ret;
    }

    // ✅ Register DELETE `/api/backgrounds` (for deletions)
    httpd_uri_t background_delete_uri = {
        .uri = "/api/backgrounds",
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
