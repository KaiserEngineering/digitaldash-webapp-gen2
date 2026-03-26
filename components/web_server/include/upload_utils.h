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

#ifndef UPLOAD_UTILS_H
#define UPLOAD_UTILS_H

#include "esp_err.h"
#include "esp_http_server.h"
#include <stdio.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Standard chunk size for uploads (4KB aligns with flash page size) */
#define UPLOAD_CHUNK_SIZE 4096

/* Maximum timeout retries before giving up */
#define UPLOAD_MAX_TIMEOUT_RETRIES 10

/* HTTP 413 Payload Too Large */
#ifndef HTTPD_413_PAYLOAD_TOO_LARGE
#define HTTPD_413_PAYLOAD_TOO_LARGE 413
#endif

/* Upload result codes */
typedef enum {
    UPLOAD_OK = 0,
    UPLOAD_ERR_TIMEOUT,
    UPLOAD_ERR_SOCKET,
    UPLOAD_ERR_CLOSED,
    UPLOAD_ERR_WRITE,
    UPLOAD_ERR_TOO_LARGE,
    UPLOAD_ERR_NO_CONTENT,
    UPLOAD_ERR_FILE_OPEN,
    UPLOAD_ERR_CHECKSUM,
    UPLOAD_ERR_RENAME,
    UPLOAD_ERR_STORAGE_FULL
} upload_result_t;

/* HTTP 422 Unprocessable Entity (checksum mismatch) */
#ifndef HTTPD_422_UNPROCESSABLE_ENTITY
#define HTTPD_422_UNPROCESSABLE_ENTITY 422
#endif

/**
 * Send a JSON error response with logging
 *
 * @param req         HTTP request handle
 * @param status      HTTP status string (e.g., "500 Internal Server Error")
 * @param error_msg   Error message to send to client
 * @param log_tag     Tag for ESP_LOGE logging
 * @param log_msg     Message to log (can be same as error_msg)
 */
void upload_send_error(httpd_req_t *req, const char *status,
                       const char *error_msg, const char *log_tag,
                       const char *log_msg);

/**
 * Receive data chunk from HTTP request with timeout retry handling
 *
 * @param req           HTTP request handle
 * @param buf           Buffer to receive data into
 * @param buf_size      Size of buffer
 * @param remaining     Bytes remaining to receive (will receive min of this and buf_size)
 * @param received_out  Output: actual bytes received
 * @param log_tag       Tag for logging
 * @return              UPLOAD_OK on success, error code on failure
 */
upload_result_t upload_receive_chunk(httpd_req_t *req, char *buf, size_t buf_size,
                                     int remaining, int *received_out,
                                     const char *log_tag);

/**
 * Upload file from HTTP request to filesystem
 *
 * Handles the full upload loop: receiving chunks, writing to file,
 * cleanup on error, and timeout retry logic.
 *
 * @param req           HTTP request handle
 * @param filepath      Destination file path
 * @param max_size      Maximum allowed file size (0 = no limit)
 * @param bytes_written Output: total bytes written on success
 * @param log_tag       Tag for logging
 * @return              UPLOAD_OK on success, error code on failure
 */
upload_result_t upload_to_file(httpd_req_t *req, const char *filepath,
                               size_t max_size, int *bytes_written,
                               const char *log_tag);

/**
 * Upload data from HTTP request to a memory buffer
 *
 * @param req           HTTP request handle
 * @param buf           Buffer to receive data into
 * @param buf_size      Size of buffer (upload will fail if content exceeds this)
 * @param bytes_read    Output: actual bytes received
 * @param log_tag       Tag for logging
 * @return              UPLOAD_OK on success, error code on failure
 */
upload_result_t upload_to_buffer(httpd_req_t *req, char *buf, size_t buf_size,
                                 int *bytes_read, const char *log_tag);

/**
 * Send HTTP error response for upload result
 *
 * @param req       HTTP request handle
 * @param result    Upload result code
 * @param log_tag   Tag for logging
 * @return          ESP_OK after sending response
 */
esp_err_t upload_send_result_error(httpd_req_t *req, upload_result_t result,
                                   const char *log_tag);

#ifdef __cplusplus
}
#endif

#endif // UPLOAD_UTILS_H
