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

#include "user_images.h"
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

#define HTTPD_507_INSUFFICIENT_STORAGE 507

static const char *TAG = "BackgroundRoutes";

#define MAX_PATH_SIZE 256
#define MAX_RESPONSE_SIZE 4096 // Static response buffer
#define MAX_HEADER_SIZE 512
#define MAX_FILES 100 // Maximum number of files that can be listed

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

// Check if file is an image and get its MIME type
bool is_img_file(const char *filename, const char **mime_type)
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

esp_err_t list_user_images(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    const char *image_dir = "/spiffs/data";
    DIR *dir = opendir(image_dir);
    if (!dir)
    {
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open user images directory");
    }

    char response[MAX_RESPONSE_SIZE] = "{";
    size_t len = 1;
    struct dirent *entry;
    struct stat st;
    char filepath[MAX_PATH_SIZE];
    int file_count = 0;

    while ((entry = readdir(dir)) != NULL && file_count < MAX_FILES)
    {
        const char *mime_type;
        if (is_img_file(entry->d_name, &mime_type))
        {
            snprintf(filepath, sizeof(filepath), "%.200s/%.50s", image_dir, entry->d_name);
            if (stat(filepath, &st) == 0)
            {
                if (len + 256 >= MAX_RESPONSE_SIZE - 2)
                {
                    break;
                }

                if (file_count > 0)
                {
                    response[len++] = ',';
                }

                len += snprintf(response + len, MAX_RESPONSE_SIZE - len,
                                "\"%s\": {\"url\": \"/api/user_images/%s\", \"size\": %lld, \"type\": \"%s\", \"lastModified\": %lld}",
                                entry->d_name, entry->d_name, (long long)st.st_size, mime_type, (long long)st.st_mtime);

                file_count++;
            }
        }
    }
    closedir(dir);

    response[len++] = '}';
    response[len] = '\0';

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, response, len);
}

esp_err_t get_user_image(httpd_req_t *req)
{
    ESP_LOGI(TAG, "GET request received: %s", req->uri);

    const char *prefix = "/api/user_image/";
    if (strncmp(req->uri, prefix, strlen(prefix)) != 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid user image request");
    }

    const char *image_name = req->uri + strlen(prefix);
    const char *mime_type;
    if (!is_img_file(image_name, &mime_type))
    {
        ESP_LOGE(TAG, "Invalid file type requested: %s", image_name);
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid file type");
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/%s", image_name);

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

    /* Set Keep-Alive Header */
    err = httpd_resp_set_hdr(req, "Connection", "Keep-Alive");
    if (err != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to set Connection header: %s", esp_err_to_name(err));
        return err;
    }

    char chunk[512]; // Reduce chunk size for better memory handling
    size_t read_bytes;
    int total_bytes_sent = 0;

    int read_count = 0;
    while ((read_bytes = fread(chunk, 1, sizeof(chunk), file)) > 0)
    {
        esp_err_t ret = httpd_resp_send_chunk(req, chunk, read_bytes);
        if (ret != ESP_OK) // Client disconnected or error sending data
        {
            ESP_LOGE(TAG, "Client disconnected or error sending chunk. Stopping transmission.");
            fclose(file);
            return ret; // Exit cleanly
        }
        total_bytes_sent += read_bytes;

        read_count++;
        if (read_count % 10 == 0)
        { // Flush cache every 10 reads
            fflush(file);
        }

        vTaskDelay(1 / portTICK_PERIOD_MS); // Prevent watchdog timeout
    }

    fclose(file);
    ESP_LOGI(TAG, "Total bytes sent: %d", total_bytes_sent);

    return httpd_resp_send_chunk(req, NULL, 0); // End response
}

esp_err_t user_image_upload_handler(httpd_req_t *req)
{
    const char *prefix = "/api/user_image/";
    if (strncmp(req->uri, prefix, strlen(prefix)) != 0)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid user image request");
    }
    const char *original_filename = req->uri + strlen(prefix);
    char filename[MAX_PATH_SIZE];
    snprintf(filename, sizeof(filename), "%s", original_filename);

    /* Validate image type */
    const char *mime_type;
    if (!is_img_file(filename, &mime_type))
    {
        ESP_LOGE(TAG, "Unsupported file type: %s", filename);
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Unsupported file type");
    }

    char filepath[MAX_PATH_SIZE];
    snprintf(filepath, sizeof(filepath), "/spiffs/data/%.200s", filename);

    FILE *file = fopen(filepath, "wb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for writing: %s, errno: %d", filepath, errno);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to open file");
    }

    int remaining = req->content_len;
    char buf[512];
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
        fwrite(buf, 1, received, file);
        remaining -= received;
    }
    fclose(file);

    /* Validate the file size if needed ... */

    httpd_resp_set_type(req, "application/json");
    char response[512];
    snprintf(response, sizeof(response), "{\"message\": \"File uploaded successfully\", \"filename\": \"%.255s\"}", filename);
    return httpd_resp_sendstr(req, response);
}

esp_err_t user_image_delete_handler(httpd_req_t *req)
{
    char encoded_filename[128];
    char query[128];
    char decoded_filename[128];

    // Extract the filename query parameter
    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK &&
        httpd_query_key_value(query, "filename", encoded_filename, sizeof(encoded_filename)) == ESP_OK)
    {
        url_decode(decoded_filename, encoded_filename, sizeof(decoded_filename));
        ESP_LOGI(TAG, "Requested DELETE for file: %s", decoded_filename);

        // Construct full file path
        char filepath[MAX_PATH_SIZE];
        snprintf(filepath, sizeof(filepath), "/spiffs/data/%s", decoded_filename);

        // Check if the file exists before attempting to delete
        FILE *file = fopen(filepath, "r");
        if (!file)
        {
            ESP_LOGW(TAG, "File not found: %s", filepath);
            return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
        }
        fclose(file); // Close file before deleting

        // Delete the file
        if (unlink(filepath) == 0)
        {
            ESP_LOGI(TAG, "File deleted successfully: %s", filepath);
            return httpd_resp_sendstr(req, "File deleted successfully");
        }
        else
        {
            ESP_LOGW(TAG, "Failed to delete file: %s", filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to delete file");
        }
    }

    return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid request or file not found");
}

esp_err_t register_user_images(httpd_handle_t server)
{
    httpd_uri_t user_image_get_uri = {
        .uri = "/api/user_image/*",
        .method = HTTP_GET,
        .handler = get_user_image,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &user_image_get_uri);

    httpd_uri_t user_images_list_uri = {
        .uri = "/api/user_images",
        .method = HTTP_GET,
        .handler = list_user_images,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &user_images_list_uri);

    httpd_uri_t user_image_delete_uri = {
        .uri = "/api/user_image/*",
        .method = HTTP_DELETE,
        .handler = user_image_delete_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &user_image_delete_uri);

    httpd_uri_t user_image_upload_uri = {
        .uri = "/api/user_image/*",
        .method = HTTP_POST,
        .handler = user_image_upload_handler,
        .user_ctx = NULL};
    httpd_register_uri_handler(server, &user_image_upload_uri);

    ESP_LOGI(TAG, "User image routes registered successfully");
    return ESP_OK;
}
