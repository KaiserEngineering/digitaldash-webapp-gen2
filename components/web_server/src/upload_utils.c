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
#include "esp_heap_caps.h"
#include "esp_rom_crc.h"
#include <string.h>
#include <sys/param.h>

/**
 * Parse X-Checksum-CRC32 header value (hex string like "A1B2C3D4")
 * Returns 0 if header not present or invalid
 */
static uint32_t parse_checksum_header(httpd_req_t *req)
{
    char checksum_str[16] = {0};
    size_t hdr_len = httpd_req_get_hdr_value_len(req, "X-Checksum-CRC32");

    if (hdr_len == 0 || hdr_len >= sizeof(checksum_str)) {
        return 0;  // No checksum header or too long
    }

    if (httpd_req_get_hdr_value_str(req, "X-Checksum-CRC32", checksum_str, sizeof(checksum_str)) != ESP_OK) {
        return 0;
    }

    // Parse hex string
    char *endptr;
    uint32_t checksum = strtoul(checksum_str, &endptr, 16);
    if (*endptr != '\0') {
        return 0;  // Invalid hex
    }

    return checksum;
}

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

    /* Check for checksum header */
    uint32_t expected_crc = parse_checksum_header(req);
    bool verify_checksum = (expected_crc != 0);
    if (verify_checksum) {
        ESP_LOGI(log_tag, "Checksum verification enabled (expected: 0x%08X)",
                 (unsigned)expected_crc);
    }

    /* Allocate upload buffer from SPIRAM to preserve internal SRAM for other uses */
    char *buf = (char *)heap_caps_malloc(UPLOAD_CHUNK_SIZE, MALLOC_CAP_SPIRAM);
    if (!buf) {
        ESP_LOGE(log_tag, "Failed to allocate upload buffer from SPIRAM");
        return UPLOAD_ERR_FILE_OPEN;
    }

    FILE *file = file_handler_open_write(filepath);
    if (!file) {
        ESP_LOGE(log_tag, "Failed to open file for writing: %s", filepath);
        free(buf);
        return UPLOAD_ERR_FILE_OPEN;
    }

    int remaining = req->content_len;
    int total_received = 0;
    uint32_t running_crc = 0;

    while (remaining > 0) {
        int received = 0;
        upload_result_t result = upload_receive_chunk(req, buf, UPLOAD_CHUNK_SIZE,
                                                      remaining, &received, log_tag);

        if (result != UPLOAD_OK) {
            file_handler_close(file);
            file_handler_delete(filepath);
            free(buf);
            return result;
        }

        /* Update running CRC if verification enabled */
        if (verify_checksum) {
            running_crc = esp_rom_crc32_le(running_crc, (const uint8_t *)buf, received);
        }

        size_t written = fwrite(buf, 1, received, file);
        if (written != (size_t)received) {
            ESP_LOGE(log_tag, "File write error (%zu vs %d)", written, received);
            file_handler_close(file);
            file_handler_delete(filepath);
            free(buf);
            return UPLOAD_ERR_WRITE;
        }

        remaining -= received;
        total_received += received;
    }

    file_handler_close(file);
    free(buf);

    /* Verify checksum if header was provided */
    if (verify_checksum && running_crc != expected_crc) {
        ESP_LOGE(log_tag, "Checksum mismatch! Expected: 0x%08X, Got: 0x%08X",
                 (unsigned)expected_crc, (unsigned)running_crc);
        file_handler_delete(filepath);
        return UPLOAD_ERR_CHECKSUM;
    }

    *bytes_written = total_received;

    if (verify_checksum) {
        ESP_LOGI(log_tag, "File uploaded and verified: %s (%d bytes, CRC: 0x%08X)",
                 filepath, total_received, (unsigned)running_crc);
    } else {
        ESP_LOGI(log_tag, "File uploaded successfully: %s (%d bytes)",
                 filepath, total_received);
    }
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
        case UPLOAD_ERR_CHECKSUM:
            upload_send_error(req, "422 Unprocessable Entity",
                              "Checksum verification failed - file may be corrupted",
                              log_tag, "CRC32 checksum mismatch");
            break;
        default:
            upload_send_error(req, "500 Internal Server Error",
                              "Upload failed", log_tag, "Unknown upload error");
            break;
    }
    return ESP_OK;
}
