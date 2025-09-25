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

#include "file_handler.h"
#include "esp_err.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_vfs.h"
#include "esp_spiffs.h"
#include <errno.h>
#include <fcntl.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/param.h>

static const char *TAG = "FileHandler";

#define INITIAL_FILE_LIST_CAPACITY 50
#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 1024)
#define SCRATCH_BUFSIZE (20480)
#define MAX_FILE_SIZE (4 * 1024 * 1024)
#define CHECK_FILE_EXTENSION(filename, ext) (strcasecmp(&filename[strlen(filename) - strlen(ext)], ext) == 0)
#define SPIFFS_WRITE_SIZE 4096

// Define HTTP 413 Payload Too Large if not defined
#ifndef HTTPD_413_PAYLOAD_TOO_LARGE
#define HTTPD_413_PAYLOAD_TOO_LARGE 413
#endif

// Forward declarations
static esp_err_t spiffs_list_handler(httpd_req_t *req);
static esp_err_t spiffs_upload_handler(httpd_req_t *req);
static esp_err_t spiffs_delete_handler(httpd_req_t *req);
static esp_err_t spiffs_info_handler(httpd_req_t *req);

static esp_err_t set_content_type_from_file(httpd_req_t *req, const char *filepath)
{
    const char *type = "text/plain";
    if (CHECK_FILE_EXTENSION(filepath, ".html"))
        type = "text/html";
    else if (CHECK_FILE_EXTENSION(filepath, ".js"))
        type = "application/javascript";
    else if (CHECK_FILE_EXTENSION(filepath, ".css"))
        type = "text/css";
    else if (CHECK_FILE_EXTENSION(filepath, ".png"))
        type = "image/png";
    else if (CHECK_FILE_EXTENSION(filepath, ".ico"))
        type = "image/x-icon";
    else if (CHECK_FILE_EXTENSION(filepath, ".svg"))
        type = "image/svg+xml";
    else if (CHECK_FILE_EXTENSION(filepath, ".json"))
        type = "application/json";
    else if (CHECK_FILE_EXTENSION(filepath, ".webmanifest"))
        type = "application/manifest+json";

    httpd_resp_set_type(req, type);
    return ESP_OK;
}

esp_err_t file_handler_init(void)
{
    ESP_LOGI(TAG, "File handler initialized");
    return ESP_OK;
}

esp_err_t file_handler_list_files(const char *directory, file_list_t **file_list)
{
    if (!directory || !file_list)
    {
        ESP_LOGE(TAG, "Invalid parameters for file_handler_list_files");
        return ESP_ERR_INVALID_ARG;
    }

    DIR *dir = opendir(directory);
    if (!dir)
    {
        ESP_LOGE(TAG, "Failed to open directory: %s", directory);
        return ESP_FAIL;
    }

    *file_list = malloc(sizeof(file_list_t));
    if (!*file_list)
    {
        ESP_LOGE(TAG, "Failed to allocate memory for file list");
        closedir(dir);
        return ESP_ERR_NO_MEM;
    }

    (*file_list)->files = malloc(sizeof(file_info_t) * INITIAL_FILE_LIST_CAPACITY);
    if (!(*file_list)->files)
    {
        ESP_LOGE(TAG, "Failed to allocate memory for file info array");
        free(*file_list);
        *file_list = NULL;
        closedir(dir);
        return ESP_ERR_NO_MEM;
    }

    (*file_list)->count = 0;
    (*file_list)->capacity = INITIAL_FILE_LIST_CAPACITY;

    struct dirent *entry;
    struct stat st;
    char filepath[512];

    while ((entry = readdir(dir)) != NULL)
    {
        if ((*file_list)->count >= (*file_list)->capacity)
        {
            size_t new_capacity = (*file_list)->capacity * 2;
            file_info_t *new_files = realloc((*file_list)->files, sizeof(file_info_t) * new_capacity);
            if (!new_files)
            {
                ESP_LOGW(TAG, "Failed to expand file list, truncating at %zu files", (*file_list)->count);
                break;
            }
            (*file_list)->files = new_files;
            (*file_list)->capacity = new_capacity;
        }

        snprintf(filepath, sizeof(filepath), "%s/%s", directory, entry->d_name);

        if (stat(filepath, &st) == 0)
        {
            file_info_t *info = &(*file_list)->files[(*file_list)->count];
            strncpy(info->name, entry->d_name, sizeof(info->name) - 1);
            info->name[sizeof(info->name) - 1] = '\0';
            info->size = st.st_size;
            info->last_modified = st.st_mtime;
            info->is_directory = S_ISDIR(st.st_mode);
            (*file_list)->count++;
        }
    }

    closedir(dir);
    ESP_LOGI(TAG, "Listed %zu files in directory: %s", (*file_list)->count, directory);
    return ESP_OK;
}

esp_err_t file_handler_get_file_info(const char *filepath, file_info_t *info)
{
    if (!filepath || !info)
    {
        ESP_LOGE(TAG, "Invalid parameters for file_handler_get_file_info");
        return ESP_ERR_INVALID_ARG;
    }

    struct stat st;
    if (stat(filepath, &st) != 0)
    {
        ESP_LOGE(TAG, "Failed to get file info for: %s", filepath);
        return ESP_FAIL;
    }

    const char *filename = strrchr(filepath, '/');
    filename = filename ? filename + 1 : filepath;

    strncpy(info->name, filename, sizeof(info->name) - 1);
    info->name[sizeof(info->name) - 1] = '\0';
    info->size = st.st_size;
    info->last_modified = st.st_mtime;
    info->is_directory = S_ISDIR(st.st_mode);

    return ESP_OK;
}

FILE *file_handler_open_read(const char *filepath)
{
    if (!filepath)
    {
        ESP_LOGE(TAG, "Invalid filepath for file_handler_open_read");
        return NULL;
    }

    FILE *file = fopen(filepath, "rb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for reading: %s, errno: %d", filepath, errno);
    }
    return file;
}

FILE *file_handler_open_write(const char *filepath)
{
    if (!filepath)
    {
        ESP_LOGE(TAG, "Invalid filepath for file_handler_open_write");
        return NULL;
    }

    FILE *file = fopen(filepath, "wb");
    if (!file)
    {
        ESP_LOGE(TAG, "Failed to open file for writing: %s, errno: %d", filepath, errno);
    }
    return file;
}

esp_err_t file_handler_close(FILE *file)
{
    if (!file)
    {
        ESP_LOGE(TAG, "Invalid file pointer for file_handler_close");
        return ESP_ERR_INVALID_ARG;
    }

    if(fflush(file) != 0)
    {
        ESP_LOGE(TAG, "Failed to flush file, errno: %d", errno);
        return ESP_FAIL;
    }

    if (fclose(file) == 0)
    {
        return ESP_OK;
    }
    else
    {
        ESP_LOGE(TAG, "Failed to close file, errno: %d", errno);
        return ESP_FAIL;
    }
}

esp_err_t file_handler_delete(const char *filepath)
{
    if (!filepath)
    {
        ESP_LOGE(TAG, "Invalid filepath for file_handler_delete");
        return ESP_ERR_INVALID_ARG;
    }

    if (unlink(filepath) == 0)
    {
        ESP_LOGI(TAG, "File deleted successfully: %s", filepath);
        return ESP_OK;
    }
    else
    {
        ESP_LOGE(TAG, "Failed to delete file: %s, errno: %d", filepath, errno);
        return ESP_FAIL;
    }
}

esp_err_t file_handler_exists(const char *filepath, bool *exists)
{
    if (!filepath || !exists)
    {
        ESP_LOGE(TAG, "Invalid parameters for file_handler_exists");
        return ESP_ERR_INVALID_ARG;
    }

    struct stat st;
    *exists = (stat(filepath, &st) == 0);
    return ESP_OK;
}

void file_handler_free_list(file_list_t *file_list)
{
    if (file_list)
    {
        if (file_list->files)
        {
            free(file_list->files);
        }
        free(file_list);
    }
}

esp_err_t spiffs_file_handler(httpd_req_t *req)
{
    char filepath[FILE_PATH_MAX];

    snprintf(filepath, sizeof(filepath), "/spiffs%s", req->uri);

    int fd = open(filepath, O_RDONLY);
    if (fd >= 0)
    {
        ESP_LOGI(TAG, "Serving SPIFFS file: %s", filepath);
        set_content_type_from_file(req, filepath);
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");

        char buffer[SCRATCH_BUFSIZE];
        ssize_t read_bytes;
        while ((read_bytes = read(fd, buffer, SCRATCH_BUFSIZE)) > 0)
        {
            if (httpd_resp_send_chunk(req, buffer, read_bytes) != ESP_OK)
            {
                close(fd);
                ESP_LOGE(TAG, "Failed to send file: %s", filepath);
                return ESP_FAIL;
            }
        }

        close(fd);
        httpd_resp_send_chunk(req, NULL, 0);
        return ESP_OK;
    }
    return ESP_ERR_NOT_FOUND;
}

static esp_err_t spiffs_list_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "SPIFFS list request: %s", req->uri);

    // Check if there's a filter parameter
    char query[128];
    char filter[32] = {0};
    bool filter_all = false;
    bool filter_bin_only = true; // Default to .bin only

    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK)
    {
        if (httpd_query_key_value(query, "filter", filter, sizeof(filter)) == ESP_OK)
        {
            if (strcmp(filter, "all") == 0)
            {
                filter_all = true;
                filter_bin_only = false;
            }
            else if (strcmp(filter, ".bin") == 0 || strcmp(filter, "bin") == 0)
            {
                filter_all = false;
                filter_bin_only = true;
            }
        }
    }

    // Open the SPIFFS directory
    DIR *dir = opendir("/spiffs");
    if (!dir)
    {
        ESP_LOGW(TAG, "Failed to open /spiffs directory");
        httpd_resp_set_type(req, "application/json");
        return httpd_resp_sendstr(req, "{\"files\": []}");
    }

    // Build JSON response using stack buffer
    char response[2048]; // Use stack buffer to avoid heap fragmentation
    strcpy(response, "{\"files\": [");
    bool first_file = true;
    struct dirent *entry;
    size_t response_len = strlen(response);

    while ((entry = readdir(dir)) != NULL)
    {
        // Skip hidden files and directories
        if (entry->d_name[0] == '.')
        {
            continue;
        }

        size_t name_len = strlen(entry->d_name);
        bool include_file = false;
        const char *file_type = "Unknown file";

        // Determine if we should include this file based on filter
        if (filter_all)
        {
            // Include all files
            include_file = true;
            // Determine file type based on extension
            if (name_len > 4 && strcasecmp(&entry->d_name[name_len - 4], ".bin") == 0)
            {
                file_type = "Binary file";
            }
            else if (name_len > 4 && strcasecmp(&entry->d_name[name_len - 4], ".txt") == 0)
            {
                file_type = "Text file";
            }
            else if (name_len > 4 && strcasecmp(&entry->d_name[name_len - 4], ".json") == 0)
            {
                file_type = "JSON file";
            }
            else if (name_len > 4 && strcasecmp(&entry->d_name[name_len - 4], ".cfg") == 0)
            {
                file_type = "Configuration file";
            }
            else
            {
                file_type = "Unknown file";
            }
        }
        else if (filter_bin_only)
        {
            // Only .bin files
            if (name_len > 4 && strcasecmp(&entry->d_name[name_len - 4], ".bin") == 0)
            {
                include_file = true;
                file_type = "Binary file";
            }
        }

        if (include_file)
        {
            // Get file info
            char file_path[FILE_PATH_MAX];
            snprintf(file_path, sizeof(file_path), "/spiffs/%s", entry->d_name);

            file_info_t file_info;
            if (file_handler_get_file_info(file_path, &file_info) == ESP_OK)
            {
                // Check if we have enough space for this entry
                char file_json[256];
                int entry_len = snprintf(file_json, sizeof(file_json),
                                       "%s{\"name\": \"%s\", \"size\": %zu, \"type\": \"%s\"}",
                                       first_file ? "" : ", ",
                                       file_info.name, file_info.size, file_type);

                // Ensure we don't exceed buffer size (leave room for closing "]}")
                if (response_len + entry_len + 3 < sizeof(response))
                {
                    strcat(response, file_json);
                    response_len += entry_len;
                    first_file = false;
                }
                else
                {
                    ESP_LOGW(TAG, "Response buffer full, truncating file list");
                    break;
                }
            }
        }
    }

    strcat(response, "]}");
    closedir(dir);

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, response, strlen(response));
}

static esp_err_t spiffs_upload_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "SPIFFS upload request: %s (len=%d)", req->uri, req->content_len);

    if (req->content_len > MAX_FILE_SIZE) {
        ESP_LOGW(TAG, "File too large: %d bytes (max: %d)", req->content_len, MAX_FILE_SIZE);
        return httpd_resp_send_err(req, HTTPD_413_PAYLOAD_TOO_LARGE, "File too large");
    }

    if (req->content_len == 0) {
        ESP_LOGW(TAG, "No content received");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No file content");
    }

    // Extract filename from URI path (after /api/spiffs/)
    const char *prefix = "/api/spiffs/";
    const char *filename = NULL;

    if (strncmp(req->uri, prefix, strlen(prefix)) == 0) {
        filename = req->uri + strlen(prefix);
    }

    if (!filename || strlen(filename) == 0) {
        ESP_LOGW(TAG, "No filename in URI path");
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename in path");
    }

    ESP_LOGI(TAG, "Uploading file: %s", filename);

    char filepath[FILE_PATH_MAX];
    snprintf(filepath, sizeof(filepath), "/spiffs/%s", filename);

    FILE *file = file_handler_open_write(filepath);
    if (!file) {
        ESP_LOGE(TAG, "Failed to open file for writing: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to create file");
    }

    int remaining = req->content_len;
    char buf[SPIFFS_WRITE_SIZE];
    int total_received = 0;

    while (remaining > 0) {
        int recv_len = MIN(remaining, (int)sizeof(buf));
        int received = httpd_req_recv(req, buf, recv_len);

        if (received < 0) {
            if (received == HTTPD_SOCK_ERR_TIMEOUT) {
                // retry instead of failing immediately
                ESP_LOGW(TAG, "Socket timeout, retrying...");
                continue;
            }
            ESP_LOGE(TAG, "Socket error: %d", received);
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File upload failed");
        } else if (received == 0) {
            // unexpected end of stream
            ESP_LOGE(TAG, "Connection closed before file fully received");
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File upload incomplete");
        }

        size_t written = fwrite(buf, 1, received, file);
        if (written != received) {
            ESP_LOGE(TAG, "Error writing to file (%d vs %d)", written, received);
            file_handler_close(file);
            file_handler_delete(filepath);
            return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "File write failed");
        }

        remaining -= received;
        total_received += received;
    }

    file_handler_close(file);

    ESP_LOGI(TAG, "File uploaded successfully: %s (%d bytes)", filepath, total_received);

    // Respond
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response),
             "{\"message\":\"File uploaded successfully\",\"filename\":\"%s\",\"size\":%d}",
             filename, total_received);
    return httpd_resp_sendstr(req, response);
}

static esp_err_t spiffs_delete_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "SPIFFS delete request: %s", req->uri);

    char query[128];
    char filename[128];

    if (httpd_req_get_url_query_str(req, query, sizeof(query)) != ESP_OK ||
        httpd_query_key_value(query, "filename", filename, sizeof(filename)) != ESP_OK)
    {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing filename parameter");
    }

    ESP_LOGI(TAG, "Requested DELETE for file: %s", filename);

    char filepath[FILE_PATH_MAX];
    snprintf(filepath, sizeof(filepath), "/spiffs/%s", filename);

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
                 "{\"message\": \"File deleted successfully\", \"filename\": \"%s\"}", filename);
        return httpd_resp_sendstr(req, response);
    }
    else
    {
        ESP_LOGE(TAG, "Failed to delete file: %s", filepath);
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to delete file");
    }
}

static esp_err_t spiffs_info_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "SPIFFS info request: %s", req->uri);

    size_t total = 0, used = 0;
    esp_err_t ret = esp_spiffs_info(NULL, &total, &used);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get SPIFFS info: %s", esp_err_to_name(ret));
        return httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to get SPIFFS info");
    }

    size_t free_space = total - used;
    float usage_percent = total > 0 ? ((float)used / (float)total) * 100.0f : 0.0f;

    // Build JSON response
    char response[512];
    snprintf(response, sizeof(response),
             "{"
             "\"success\": true,"
             "\"total\": %zu,"
             "\"used\": %zu,"
             "\"free\": %zu,"
             "\"usage_percent\": %.1f"
             "}",
             total, used, free_space, usage_percent);

    httpd_resp_set_type(req, "application/json");
    return httpd_resp_send(req, response, strlen(response));
}

esp_err_t register_spiffs(httpd_handle_t server)
{
    // Register URI handlers
    httpd_uri_t list_spiffs_uri = {
        .uri = "/api/spiffs",
        .method = HTTP_GET,
        .handler = spiffs_list_handler,
        .user_ctx = NULL};

    httpd_uri_t upload_spiffs_uri = {
        .uri = "/api/spiffs/*",
        .method = HTTP_POST,
        .handler = spiffs_upload_handler,
        .user_ctx = NULL};

    httpd_uri_t delete_spiffs_uri = {
        .uri = "/api/spiffs",
        .method = HTTP_DELETE,
        .handler = spiffs_delete_handler,
        .user_ctx = NULL};

    httpd_uri_t info_spiffs_uri = {
        .uri = "/api/spiffs/info",
        .method = HTTP_GET,
        .handler = spiffs_info_handler,
        .user_ctx = NULL};

    esp_err_t err;
    if ((err = httpd_register_uri_handler(server, &list_spiffs_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &upload_spiffs_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &delete_spiffs_uri)) != ESP_OK ||
        (err = httpd_register_uri_handler(server, &info_spiffs_uri)) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register SPIFFS URI handlers: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "SPIFFS routes registered successfully");
    return ESP_OK;
}
