#include <string.h>
#include <fcntl.h>
#include "esp_vfs.h"
#include "esp_log.h"
#include <stdio.h>
#include <stdlib.h>
#include "web_server.h"
#include "esp_ota_ops.h"
#include "esp_http_server.h"

static const char *TAG = "WebServer";

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 128)
#define SCRATCH_BUFSIZE (20480)

/* Error response helper */
static void send_error_response(httpd_req_t *req, const char *status, const char *error_message, const char *log_message)
{
    ESP_LOGE(TAG, "%s", log_message);
    httpd_resp_set_status(req, status);
    httpd_resp_set_type(req, "application/json");
    char response[256];
    snprintf(response, sizeof(response), "{\"error\": \"%s\"}", error_message);
    httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}

/* Handle OTA file upload */
esp_err_t update_post_handler(httpd_req_t *req)
{
    char buf[1000];
    esp_ota_handle_t ota_handle;
    int remaining = req->content_len;

    const esp_partition_t *ota_partition = esp_ota_get_next_update_partition(NULL);
    ESP_ERROR_CHECK(esp_ota_begin(ota_partition, OTA_SIZE_UNKNOWN, &ota_handle));
    if (!ota_partition)
    {
        send_error_response(req, "500 Internal Server Error", "Failed to get OTA partition", "OTA partition retrieval failed");
        return ESP_FAIL;
    }

    if (esp_ota_begin(ota_partition, OTA_SIZE_UNKNOWN, &ota_handle) != ESP_OK)
    {
        send_error_response(req, "500 Internal Server Error", "OTA begin failed", "OTA begin operation failed");
        return ESP_FAIL;
    }

    while (remaining > 0)
    {
        int recv_len = httpd_req_recv(req, buf, remaining < sizeof(buf) ? remaining : sizeof(buf));
        if (recv_len == HTTPD_SOCK_ERR_TIMEOUT)
        {
            continue;
        }
        else if (recv_len <= 0)
        {
            send_error_response(req, "500 Internal Server Error", "Protocol error during OTA", "HTTP receive error during OTA");
            esp_ota_end(ota_handle);
            return ESP_FAIL;
        }

        if (esp_ota_write(ota_handle, (const void *)buf, recv_len) != ESP_OK)
        {
            send_error_response(req, "500 Internal Server Error", "Flash error during OTA", "OTA write operation failed");
            esp_ota_end(ota_handle);
            return ESP_FAIL;
        }

        remaining -= recv_len;
    }

    if (esp_ota_end(ota_handle) != ESP_OK || esp_ota_set_boot_partition(ota_partition) != ESP_OK)
    {
        send_error_response(req, "500 Internal Server Error", "Validation or activation error", "OTA end or boot partition activation failed");
        return ESP_FAIL;
    }

    httpd_resp_sendstr(req, "Firmware update complete, rebooting now!\n");
    vTaskDelay(500 / portTICK_PERIOD_MS);
    esp_restart();
    return ESP_OK;
}

extern const uint8_t index_html_gz_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_html_gz_end[] asm("_binary_index_html_gz_end");

extern const uint8_t favicon_start[] asm("_binary_favicon_png_start");
extern const uint8_t favicon_end[] asm("_binary_favicon_png_end");

esp_err_t favicon_hanlder(httpd_req_t *req)
{
    const size_t file_size = favicon_end - favicon_start;
    httpd_resp_set_type(req, "image/png");
    return httpd_resp_send(req, (const char *)favicon_start, file_size);
}

esp_err_t index_html_handler(httpd_req_t *req)
{
    extern const uint8_t index_html_gz_start[] asm("_binary_index_html_gz_start");
    extern const uint8_t index_html_gz_end[] asm("_binary_index_html_gz_end");

    const size_t file_size = index_html_gz_end - index_html_gz_start;

    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
    return httpd_resp_send(req, (const char *)index_html_gz_start, file_size);
}

static esp_err_t update_button_handler(httpd_req_t *req)
{
    char buf[100];
    int received = httpd_req_recv(req, buf, req->content_len);
    if (received <= 0)
    {
        send_error_response(req, "500 Internal Server Error", "Failed to read request data", "HTTP request receive error");
        return ESP_FAIL;
    }

    buf[received] = '\0';

    // Variables to hold extracted data
    char id[50];
    int val;

    // Use sscanf to extract the values
    // Expected payload {"id":"<cmd>","value":<val>}
    int items = sscanf(buf, "{\"id\":\"%49[^\"]\", \"value\":%d}", id, &val);

    // Check if the extraction was successful
    if (items != 2)
    {
        send_error_response(req, "400 Bad Request", "Invalid JSON format", "JSON parsing error");
        return ESP_FAIL;
    }

    char resp[128];
    bool applied = apply_json_to_settings(id, val, resp, sizeof(resp));
    httpd_resp_set_type(req, "application/json");

    if (applied)
    {
        httpd_resp_send(req, resp, HTTPD_RESP_USE_STRLEN);
        return ESP_OK;
    }
    else
    {
        send_error_response(req, "400 Bad Request", resp, "Setting application failed");
        return ESP_FAIL;
    }
}

// Handler for POST requests to update slider RPMs
static esp_err_t update_slider_handler(httpd_req_t *req)
{
    char buf[100];
    int received = httpd_req_recv(req, buf, req->content_len);
    if (received <= 0)
    {
        send_error_response(req, "500 Internal Server Error", "Failed to read request data", "HTTP request receive error");
        return ESP_FAIL;
    }

    buf[received] = '\0';

    // Variables to hold extracted data
    char id[50];
    int val;

    // Use sscanf to extract the values
    // Expected payload {"id":"<cmd>","value":<val>}
    int items = sscanf(buf, "{\"id\":\"%49[^\"]\", \"value\":%d}", id, &val);

    // Check if the extraction was successful
    if (items != 2)
    {
        send_error_response(req, "400 Bad Request", "Invalid JSON format", "JSON parsing error");
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "id: \"%s\" value: %d", id, val);

    if (strcmp(id, "RPM1000") == 0) {
        // Do something
    } else if (strcmp(id, "RPM2000") == 0) {
        // Do something
    } else
    {
        send_error_response(req, "400 Bad Request", "Unknown command ID", "Invalid command ID in slider update");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, "{\"status\": \"Slider RPM updated\"}", HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

static esp_err_t get_values_handler(httpd_req_t *req)
{
    char response[1024];
    generate_setting_json(response, sizeof(response));

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

esp_err_t start_webserver(void)
{
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;

    ESP_LOGI(TAG, "Starting HTTP Server");

    // Start the server
    esp_err_t ret = httpd_start(&server, &config);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to start HTTP server: %s", esp_err_to_name(ret));
        return ret; // Return the error code
    }

    // Register URI handlers
    httpd_uri_t index_html = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = index_html_handler,
        .user_ctx = NULL};

    ret = httpd_register_uri_handler(server, &index_html);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register index_html handler: %s", esp_err_to_name(ret));
        httpd_stop(server); // Clean up the server
        return ret;
    }

    httpd_uri_t uri_update_button = {
        .uri = "/update_button",
        .method = HTTP_POST,
        .handler = update_button_handler,
        .user_ctx = NULL};

    ret = httpd_register_uri_handler(server, &uri_update_button);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register update_button handler: %s", esp_err_to_name(ret));
        httpd_stop(server);
        return ret;
    }

    httpd_uri_t uri_update_slider = {
        .uri = "/update_slider",
        .method = HTTP_POST,
        .handler = update_slider_handler,
        .user_ctx = NULL};

    ret = httpd_register_uri_handler(server, &uri_update_slider);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register update_slider handler: %s", esp_err_to_name(ret));
        httpd_stop(server);
        return ret;
    }

    httpd_uri_t uri_get_values = {
        .uri = "/get_values",
        .method = HTTP_GET,
        .handler = get_values_handler,
        .user_ctx = NULL};

    ret = httpd_register_uri_handler(server, &uri_get_values);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register get_values handler: %s", esp_err_to_name(ret));
        httpd_stop(server);
        return ret;
    }

    httpd_uri_t update_post = {
        .uri = "/update",
        .method = HTTP_POST,
        .handler = update_post_handler,
        .user_ctx = NULL};

    ret = httpd_register_uri_handler(server, &update_post);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register update_post handler: %s", esp_err_to_name(ret));
        httpd_stop(server);
        return ret;
    }

    httpd_register_uri_handler(server, &(httpd_uri_t){.uri = "/favicon.png", .method = HTTP_GET, .handler = favicon_hanlder});

    ESP_LOGI(TAG, "HTTP Server started successfully");
    return ESP_OK;
}
