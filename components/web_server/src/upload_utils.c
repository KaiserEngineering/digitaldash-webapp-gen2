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

#include "upload_utils.h"
#include "file_handler.h"
#include "esp_log.h"
#include <string.h>
#include <sys/param.h>

void upload_send_error(httpd_req_t *req, const char *status,
                       const char *error_msg, const char *log_tag,
                       const char *log_msg)
{
    ESP_LOGE(log_tag, "%s", log_msg);
    httpd_resp_set_status(req, status);
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response), "{\"error\": \"%s\"}", error_msg);
    httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}

upload_result_t upload_receive_chunk(httpd_req_t *req, char *buf, size_t buf_size,
                                     int remaining, int *received_out,
                                     const char *log_tag)
{
    int recv_len = MIN(remaining, (int)buf_size);
    int timeout_retries = 0;

    while (timeout_retries < UPLOAD_MAX_TIMEOUT_RETRIES) {
        int received = httpd_req_recv(req, buf, recv_len);

        if (received > 0) {
            *received_out = received;
            return UPLOAD_OK;
        }

        if (received == HTTPD_SOCK_ERR_TIMEOUT) {
            timeout_retries++;
            ESP_LOGW(log_tag, "Socket timeout (retry %d/%d)",
                     timeout_retries, UPLOAD_MAX_TIMEOUT_RETRIES);
            continue;
        }

        if (received == 0) {
            ESP_LOGE(log_tag, "Connection closed unexpectedly");
            return UPLOAD_ERR_CLOSED;
        }

        ESP_LOGE(log_tag, "Socket error: %d", received);
        return UPLOAD_ERR_SOCKET;
    }

    ESP_LOGE(log_tag, "Max timeout retries exceeded");
    return UPLOAD_ERR_TIMEOUT;
}

upload_result_t upload_to_file(httpd_req_t *req, const char *filepath,
                               size_t max_size, int *bytes_written,
                               const char *log_tag)
{
    *bytes_written = 0;

    if (req->content_len == 0) {
        ESP_LOGW(log_tag, "No content received");
        return UPLOAD_ERR_NO_CONTENT;
    }

    if (max_size > 0 && (size_t)req->content_len > max_size) {
        ESP_LOGW(log_tag, "File too large: %d bytes (max: %u)",
                 req->content_len, (unsigned)max_size);
        return UPLOAD_ERR_TOO_LARGE;
    }

    FILE *file = file_handler_open_write(filepath);
    if (!file) {
        ESP_LOGE(log_tag, "Failed to open file for writing: %s", filepath);
        return UPLOAD_ERR_FILE_OPEN;
    }

    int remaining = req->content_len;
    char buf[UPLOAD_CHUNK_SIZE];
    int total_received = 0;

    while (remaining > 0) {
        int received = 0;
        upload_result_t result = upload_receive_chunk(req, buf, sizeof(buf),
                                                      remaining, &received, log_tag);

        if (result != UPLOAD_OK) {
            file_handler_close(file);
            file_handler_delete(filepath);
            return result;
        }

        size_t written = fwrite(buf, 1, received, file);
        if (written != (size_t)received) {
            ESP_LOGE(log_tag, "File write error (%zu vs %d)", written, received);
            file_handler_close(file);
            file_handler_delete(filepath);
            return UPLOAD_ERR_WRITE;
        }

        remaining -= received;
        total_received += received;
    }

    file_handler_close(file);
    *bytes_written = total_received;

    ESP_LOGI(log_tag, "File uploaded successfully: %s (%d bytes)",
             filepath, total_received);
    return UPLOAD_OK;
}

upload_result_t upload_to_buffer(httpd_req_t *req, char *buf, size_t buf_size,
                                 int *bytes_read, const char *log_tag)
{
    *bytes_read = 0;

    if (req->content_len == 0) {
        ESP_LOGW(log_tag, "No content received");
        return UPLOAD_ERR_NO_CONTENT;
    }

    if ((size_t)req->content_len > buf_size) {
        ESP_LOGW(log_tag, "Payload too large: %d bytes (max: %u)",
                 req->content_len, (unsigned)buf_size);
        return UPLOAD_ERR_TOO_LARGE;
    }

    int remaining = req->content_len;
    int total_received = 0;

    while (remaining > 0) {
        int received = 0;
        upload_result_t result = upload_receive_chunk(req, buf + total_received,
                                                      remaining, remaining,
                                                      &received, log_tag);

        if (result != UPLOAD_OK) {
            return result;
        }

        remaining -= received;
        total_received += received;
    }

    *bytes_read = total_received;
    return UPLOAD_OK;
}

esp_err_t upload_send_result_error(httpd_req_t *req, upload_result_t result,
                                   const char *log_tag)
{
    switch (result) {
        case UPLOAD_ERR_TIMEOUT:
            upload_send_error(req, "408 Request Timeout",
                              "Upload timed out", log_tag, "Upload timeout");
            break;
        case UPLOAD_ERR_SOCKET:
            upload_send_error(req, "500 Internal Server Error",
                              "Socket error during upload", log_tag, "Socket error");
            break;
        case UPLOAD_ERR_CLOSED:
            upload_send_error(req, "500 Internal Server Error",
                              "Connection closed during upload", log_tag,
                              "Connection closed unexpectedly");
            break;
        case UPLOAD_ERR_WRITE:
            upload_send_error(req, "500 Internal Server Error",
                              "File write failed", log_tag, "File write error");
            break;
        case UPLOAD_ERR_TOO_LARGE:
            httpd_resp_send_err(req, HTTPD_413_PAYLOAD_TOO_LARGE, "File too large");
            break;
        case UPLOAD_ERR_NO_CONTENT:
            httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "No file content");
            break;
        case UPLOAD_ERR_FILE_OPEN:
            upload_send_error(req, "500 Internal Server Error",
                              "Failed to create file", log_tag,
                              "Failed to open file for writing");
            break;
        default:
            upload_send_error(req, "500 Internal Server Error",
                              "Upload failed", log_tag, "Unknown upload error");
            break;
    }
    return ESP_OK;
}
