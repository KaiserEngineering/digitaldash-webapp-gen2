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
#include "file_handler.h"
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

    file_list_t *file_list = NULL;
    esp_err_t err = file_handler_list_files(IMAGE_DIR, &file_list);
    if (err != ESP_OK || !file_list)
    {
        ESP_LOGE(TAG, "Failed to list files in directory: %s", IMAGE_DIR);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open images directory");
    }

    char response[MAX_RESPONSE_SIZE] = "{";
    size_t len = 1;
    int file_count = 0;

    for (size_t i = 0; i < file_list->count && file_count < MAX_FILES; i++)
    {
        file_info_t *info = &file_list->files[i];

        if (info->is_directory)
        {
            continue;
        }

        const char *mime_type;
        if (is_image_file(info->name, &mime_type))
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
                            info->name, info->name, (long long)info->size, mime_type, (long long)info->last_modified);

            file_count++;
        }
    }

    file_handler_free_list(file_list);

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

    FILE *file = file_handler_open_read(filepath);
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
        file_handler_close(file);
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
            file_handler_close(file);
            return ret;
        }
        total_bytes_sent += read_bytes;
        vTaskDelay(1 / portTICK_PERIOD_MS);
    }

    file_handler_close(file);
    ESP_LOGI(TAG, "Total bytes sent: %d", total_bytes_sent);
    return httpd_resp_send_chunk(req, NULL, 0);
}

esp_err_t image_upload_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "POST request received for image upload (len=%d)", req->content_len);

    if (req->content_len > MAX_FILE_SIZE) {
        ESP_LOGW(TAG, "File too large: %d bytes (max: %d)", req->content_len, MAX_FILE_SIZE);
        return httpd_resp_send_err(req, HTTPD_413_PAYLOAD_TOO_LARGE, "File too large");
    }

    if (req->content_len == 0) {
        ESP_LOGW(TAG, "No content received");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No file content");
    }

    // ---- Get Content-Type header ----
    char content_type[64] = {0};
    size_t content_type_len = httpd_req_get_hdr_value_len(req, "Content-Type");
    if (content_type_len > 0 && content_type_len < sizeof(content_type)) {
        httpd_req_get_hdr_value_str(req, "Content-Type", content_type, sizeof(content_type));
    }
    const char *extension = get_extension_from_content_type(content_type);
    if (!extension) {
        ESP_LOGW(TAG, "Unknown Content-Type: %s, defaulting to .bin", content_type);
        extension = ".bin";
    }

    // ---- Extract filename from URI ----
    const char *filename = req->uri + strlen("/api/image/");
    if (filename[0] == '\0') {
        ESP_LOGW(TAG, "No filename in URI");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename");
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "%s/%s%s", IMAGE_DIR, filename, extension);

    ESP_LOGI(TAG, "Uploading file: %s (Content-Type: %s)", filepath, content_type);

    FILE *file = file_handler_open_write(filepath);
    if (!file) {
        ESP_LOGE(TAG, "Failed to open file for writing: %s, errno=%d", filepath, errno);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to create file");
    }

    // ---- Receive and write file data ----
    int remaining = req->content_len;
    char buf[512];
    int total_received = 0;

    while (remaining > 0) {
        int recv_len = MIN(remaining, (int)sizeof(buf));
        int received = httpd_req_recv(req, buf, recv_len);

        if (received < 0) {
            if (received == HTTPD_SOCK_ERR_TIMEOUT) {
                ESP_LOGW(TAG, "Socket timeout, retrying...");
                continue; // retry instead of failing
            }
            ESP_LOGE(TAG, "Socket error: %d", received);
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File upload failed");
        } else if (received == 0) {
            ESP_LOGE(TAG, "Connection closed before file fully received");
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Upload incomplete");
        }

        size_t written = fwrite(buf, 1, received, file);
        if (written != received) {
            ESP_LOGE(TAG, "File write error (%d vs %d)", written, received);
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File write failed");
        }

        remaining -= received;
        total_received += received;
    }

    file_handler_close(file);

    ESP_LOGI(TAG, "File uploaded successfully: %s (%d bytes)", filepath, total_received);

    // ---- Send success response ----
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response),
             "{\"message\":\"File uploaded successfully\",\"filename\":\"%s%s\",\"size\":%d}",
             filename, extension, total_received);
    return httpd_resp_sendstr(req, response);
}


esp_err_t image_delete_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "DELETE request received: %s", req->uri);

    char decoded_filename[128];

    // Extract filename from URI path (after /api/image/)
    const char *prefix = "/api/image/";
    if (strncmp(req->uri, prefix, strlen(prefix)) != 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid delete request");
    }

    const char *filename_from_path = req->uri + strlen(prefix);
    if (strlen(filename_from_path) == 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename parameter");
    }

    url_decode(decoded_filename, filename_from_path, sizeof(decoded_filename));
    ESP_LOGI(TAG, "Requested DELETE for file: %s", decoded_filename);

    // Add .png extension if not present
    char filename_with_ext[132]; // 128 + 4 for ".png"
    if (strstr(decoded_filename, ".png") == NULL)
    {
        if (strlen(decoded_filename) > 123) // Leave room for ".png" + null terminator
        {
            return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Filename too long");
        }
        snprintf(filename_with_ext, sizeof(filename_with_ext), "%s.png", decoded_filename);
    }
    else
    {
        strncpy(filename_with_ext, decoded_filename, sizeof(filename_with_ext) - 1);
        filename_with_ext[sizeof(filename_with_ext) - 1] = '\0';
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "%s/%s", IMAGE_DIR, filename_with_ext);

    // Check if file exists
    bool exists;
    esp_err_t err = file_handler_exists(filepath, &exists);
    if (err != ESP_OK || !exists)
    {
        ESP_LOGW(TAG, "File not found: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
    }

    // Delete the file
    err = file_handler_delete(filepath);
    if (err == ESP_OK)
    {
        httpd_resp_set_type(req, "application/json");
        char response[256];
        snprintf(response, sizeof(response),
                 "{\"message\": \"File deleted successfully\", \"filename\": \"%s\"}", filename_with_ext);
        return httpd_resp_sendstr(req, response);
    }
    else
    {
        ESP_LOGE(TAG, "Failed to delete file: %s", filepath);
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