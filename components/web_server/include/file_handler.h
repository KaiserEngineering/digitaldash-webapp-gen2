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

#ifndef FILE_HANDLER_H
#define FILE_HANDLER_H

#include "esp_err.h"
#include "esp_http_server.h"
#include <stdio.h>
#include <sys/stat.h>
#include <dirent.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char name[256];
    size_t size;
    time_t last_modified;
    bool is_directory;
} file_info_t;

typedef struct {
    file_info_t *files;
    size_t count;
    size_t capacity;
} file_list_t;

esp_err_t file_handler_init(void);

esp_err_t file_handler_list_files(const char *directory, file_list_t **file_list);

esp_err_t file_handler_get_file_info(const char *filepath, file_info_t *info);

FILE *file_handler_open_read(const char *filepath);

FILE *file_handler_open_write(const char *filepath);

esp_err_t file_handler_close(FILE *file);

esp_err_t file_handler_delete(const char *filepath);

esp_err_t file_handler_exists(const char *filepath, bool *exists);

void file_handler_free_list(file_list_t *file_list);

esp_err_t register_spiffs(httpd_handle_t server);

esp_err_t spiffs_file_handler(httpd_req_t *req);

#ifdef __cplusplus
}
#endif

#endif // FILE_HANDLER_H