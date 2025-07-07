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
 * all copies or substantial portions of the Software.
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

#include "images_handler.h"
#include "esp_err.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "sys/stat.h"
#include "sys/dirent.h"
#include <ctype.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>
#include <sys/param.h>
#include <unistd.h>

static const char *TAG = "ImagesHandler";

#define MAX_PATH_SIZE 256
#define MAX_RESPONSE_SIZE 4096
#define MAX_FILES 100
#define MAX_FILE_SIZE (1024 * 1024)
#define IMAGE_DIR "/spiffs"

// Define HTTP 413 Payload Too Large if not defined
#ifndef HTTPD_413_PAYLOAD_TOO_LARGE
#define HTTPD_413_PAYLOAD_TOO_LARGE 413
#endif

static void url_decode(char *dest, const char *src, size_t dest_size)
{
    char a, b;
    while (*src && dest_size > 1)
    {
        if ((*src == '%') && ((a = src[1]) && (b = src[2])) &&
            (isxdigit(a) && isxdigit(b)))
        {
            *dest++ = (char)((strtol((char[3]){a, b, '\0'}, NULL, 16)) & 0xFF);
            src += 3;
        }
        else
        {
            *dest++ = *src++;
        }
        dest_size--;
    }
    *dest = '\0';
}

static bool is_image_file(const char *filename, const char **mime_type)
{
    if (strstr(filename, ".png"))
    {
        *mime_type = "image/png";
        return true;
    }
    else if (strstr(filename, ".jpg") || strstr(filename, ".jpeg"))
    {
        *mime_type = "image/jpeg";
        return true;
    }
    return false;
}

static const char *get_extension_from_content_type(const char *content_type)
{
    if (strstr(content_type, "jpeg"))
        return ".jpg";
    else if (strstr(content_type, "png"))
        return ".png";
    return ".png"; // Default fallback
}

esp_err_t list_images(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    DIR *dir = opendir(IMAGE_DIR);
    if (!dir)
    {
        ESP_LOGE(TAG, "Failed to open images directory: %s", IMAGE_DIR);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open images directory");
    }

    char response[MAX_RESPONSE_SIZE] = "{";
    size_t len = 1;
    struct dirent *entry;
    struct stat st;
    char filepath[MAX_PATH_SIZE];
    int file_count = 0;

    while ((entry = readdir(dir)) != NULL && file_count < MAX_FILES)
    {
        if (entry->d_type == DT_DIR)
        {
            continue;
        }

        const char *mime_type;
        if (is_image_file(entry->d_name, &mime_type))
        {
            snprintf(filepath, sizeof(filepath), "%s/%.*s", IMAGE_DIR, (int)(sizeof(filepath) - strlen(IMAGE_DIR) - 2), entry->d_name);
            if (stat(filepath, &st) == 0)
            {
                // Check if we have enough space for the next entry
                if (len + 256 >= MAX_RESPONSE_SIZE - 2)
                {
                    ESP_LOGW(TAG, "Response buffer nearly full, truncating file list");
                    break;
                }

                if (file_count > 0)
                {
                    response[len++] = ',';
                }

                len += snprintf(response + len, MAX_RESPONSE_SIZE - len,
                                "\"%s\": {\"url\": \"/api/image/%s\", \"size\": %lld, \"type\": \"%s\", \"lastModified\": %lld}",
                                entry->d_name, entry->d_name, (long long)st.st_size, mime_type, (long long)st.st_mtime);

                file_count++;
            }
        }
    }
    closedir(dir);

    response[len++] = '}';
    response[len] = '\0';

    ESP_LOGI(TAG, "Listed %d images", file_count);
    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, response, len);
}

esp_err_t get_image(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    const char *prefix = "/api/image/";
    if (strncmp(req->uri, prefix, strlen(prefix)) != 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid image request");
    }

    const char *image_name = req->uri + strlen(prefix);

    // Validate filename
    const char *mime_type;
    if (!is_image_file(image_name, &mime_type))
    {
        ESP_LOGE(TAG, "Invalid file type requested: %s", image_name);
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid file type");
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "%s/%s", IMAGE_DIR, image_name);

    FILE *file = fopen(filepath, "rb");
    if (!file)
    {
        ESP_LOGE(TAG, "File not found: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
    }

    ESP_LOGI(TAG, "Serving file: %s with MIME type: %s", filepath, mime_type);

    esp_err_t err = httpd_resp_set_type(req, mime_type);
    if (err != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to set Content-Type header");
        fclose(file);
        return err;
    }

    // Send file in chunks
    char chunk[512];
    size_t read_bytes;
    int total_bytes_sent = 0;

    while ((read_bytes = fread(chunk, 1, sizeof(chunk), file)) > 0)
    {
        esp_err_t ret = httpd_resp_send_chunk(req, chunk, read_bytes);
        if (ret != ESP_OK)
        {
            ESP_LOGE(TAG, "Client disconnected or error sending chunk");
            fclose(file);
            return ret;
        }
        total_bytes_sent += read_bytes;
        vTaskDelay(1 / portTICK_PERIOD_MS);
    }

    fclose(file);
    ESP_LOGI(TAG, "Total bytes sent: %d", total_bytes_sent);
    return httpd_resp_send_chunk(req, NULL, 0);
}

esp_err_t image_upload_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "POST request received for image upload");

    if (req->content_len > MAX_FILE_SIZE)
    {
        ESP_LOGW(TAG, "File too large: %zu bytes (max: %d)", req->content_len, MAX_FILE_SIZE);
        return httpd_resp_send_err(req, HTTPD_413_PAYLOAD_TOO_LARGE, "File too large");
    }

    if (req->content_len == 0)
    {
        ESP_LOGW(TAG, "No content received");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No file content");
    }

    // Get Content-Type header to determine file extension
    char content_type[64] = {0};
    size_t content_type_len = httpd_req_get_hdr_value_len(req, "Content-Type");
    if (content_type_len > 0 && content_type_len < sizeof(content_type))
    {
        httpd_req_get_hdr_value_str(req, "Content-Type", content_type, sizeof(content_type));
    }

    const char *extension = get_extension_from_content_type(content_type);

    // Extract filename from URI (after /api/image/)
    const char *filename = req->uri + strlen("/api/image/");
    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "%s/%s%s", IMAGE_DIR, filename, extension);

    ESP_LOGI(TAG, "Uploading file: %s (Content-Type: %s)", filepath, content_type);

    FILE *file = fopen(filepath, "wb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for writing: %s, errno: %d", filepath, errno);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to create file");
    }

    // Receive and write file data
    int remaining = req->content_len;
    char buf[512];
    int total_received = 0;

    while (remaining > 0)
    {
        int received = httpd_req_recv(req, buf, MIN(remaining, (int)sizeof(buf)));
        if (received <= 0)
        {
            ESP_LOGE(TAG, "Error receiving file data");
            fclose(file);
            unlink(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File upload failed");
        }

        size_t written = fwrite(buf, 1, received, file);
        if (written != received)
        {
            ESP_LOGE(TAG, "Error writing file data");
            fclose(file);
            unlink(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File write failed");
        }

        remaining -= received;
        total_received += received;
    }
    fclose(file);

    ESP_LOGI(TAG, "File uploaded successfully: %s (%d bytes)", filepath, total_received);

    // Send success response
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response),
             "{\"message\": \"File uploaded successfully\", \"filename\": \"%s%s\", \"size\": %d}",
             filename, extension, total_received);
    return httpd_resp_sendstr(req, response);
}

esp_err_t image_delete_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "DELETE request received: %s", req->uri);

    char encoded_filename[128];
    char query[128];
    char decoded_filename[128];

    if (httpd_req_get_url_query_str(req, query, sizeof(query)) != ESP_OK ||
        httpd_query_key_value(query, "filename", encoded_filename, sizeof(encoded_filename)) != ESP_OK)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename parameter");
    }

    url_decode(decoded_filename, encoded_filename, sizeof(decoded_filename));
    ESP_LOGI(TAG, "Requested DELETE for file: %s", decoded_filename);

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "%s/%s", IMAGE_DIR, decoded_filename);

    // Check if file exists
    struct stat st;
    if (stat(filepath, &st) != 0)
    {
        ESP_LOGW(TAG, "File not found: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
    }

    // Delete the file
    if (unlink(filepath) == 0)
    {
        ESP_LOGI(TAG, "File deleted successfully: %s", filepath);

        httpd_resp_set_type(req, "application/json");
        char response[256];
        snprintf(response, sizeof(response),
                 "{\"message\": \"File deleted successfully\", \"filename\": \"%s\"}", decoded_filename);
        return httpd_resp_sendstr(req, response);
    }
    else
    {
        ESP_LOGE(TAG, "Failed to delete file: %s, errno: %d", filepath, errno);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to delete file");
    }
}

esp_err_t register_images(httpd_handle_t server)
{
    // Register URI handlers
    httpd_uri_t get_image_uri = {
        .uri = "/api/image/*",
        .method = HTTP_GET,
        .handler = get_image,
        .user_ctx = NULL};

    httpd_uri_t list_images_uri = {
        .uri = "/api/images",
        .method = HTTP_GET,
        .handler = list_images,
        .user_ctx = NULL};

    httpd_uri_t upload_image_uri = {
        .uri = "/api/image/*",
        .method = HTTP_POST,
        .handler = image_upload_handler,
        .user_ctx = NULL};

    httpd_uri_t delete_image_uri = {
        .uri = "/api/image/*",
        .method = HTTP_DELETE,
        .handler = image_delete_handler,
        .user_ctx = NULL};

    esp_err_t err;
    if ((err = httpd_register_uri_handler(server, &get_image_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &list_images_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &upload_image_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &delete_image_uri)) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register URI handlers: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "Image routes registered successfully");
    return ESP_OK;
}