#include <string.h>
#include <fcntl.h>
#include "esp_vfs.h"
#include "esp_log.h"
#include <stdio.h>
#include <stdlib.h>
#include "web_server.h"
#include "esp_http_server.h"

#include "themes.h"
#include "ota_handler.h"

static const char *TAG = "WebServer";

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 128)

extern const uint8_t index_html_gz_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_html_gz_end[] asm("_binary_index_html_gz_end");

extern const uint8_t favicon_start[] asm("_binary_favicon_png_start");
extern const uint8_t favicon_end[] asm("_binary_favicon_png_end");

esp_err_t favicon_handler(httpd_req_t *req)
{
    const size_t file_size = favicon_end - favicon_start;
    httpd_resp_set_type(req, "image/png");
    return httpd_resp_send(req, (const char *)favicon_start, file_size);
}

esp_err_t index_html_handler(httpd_req_t *req)
{
    const size_t file_size = index_html_gz_end - index_html_gz_start;
    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
    return httpd_resp_send(req, (const char *)index_html_gz_start, file_size);
}

esp_err_t start_webserver(void)
{
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;
    ESP_LOGI(TAG, "Starting HTTP Server");

    esp_err_t ret = httpd_start(&server, &config);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to start HTTP server: %s", esp_err_to_name(ret));
        return ret;
    }

    httpd_uri_t index_html = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = index_html_handler,
        .user_ctx = NULL};
    ret = httpd_register_uri_handler(server, &index_html);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register index_html handler: %s", esp_err_to_name(ret));
        httpd_stop(server);
        return ret;
    }

    // Register favicon and other endpoints...
    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/favicon.png",
                                           .method = HTTP_GET,
                                           .handler = favicon_handler});

    /* Register theme endpoints */
    ret = register_themes(server);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register themes routes");
        httpd_stop(server);
        return ret;
    }

    /* Register OTA endpoints via our separate module */
    ret = register_ota_routes(server);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register OTA routes");
        httpd_stop(server);
        return ret;
    }

    ESP_LOGI(TAG, "HTTP Server started successfully");
    return ESP_OK;
}
