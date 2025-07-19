#include <string.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include "config_handler.h"
#include "esp_vfs.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_err.h"
#include "images_handler.h"
#include "file_handler.h"
#include <ctype.h>
#include <sys/param.h>
#include "version.h"
#include "pids_handler.h"
#include "ota_handler.h"

static const char *TAG = "WebServer";

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 1024)
#define SCRATCH_BUFSIZE (20480)
#define CHECK_FILE_EXTENSION(filename, ext) (strcasecmp(&filename[strlen(filename) - strlen(ext)], ext) == 0)

// Define struct to map filenames to embedded binaries
typedef struct
{
    const char *path;
    const uint8_t *start;
    const uint8_t *end;
    const char *mime_type;
} EmbeddedFile;

// Embedded files
extern const uint8_t static_index_html_start[] asm("_binary_index_html_start");
extern const uint8_t static_index_html_end[] asm("_binary_index_html_end");

// Basic web assets
extern const uint8_t static_favicon_ico_start[] asm("_binary_favicon_ico_start");
extern const uint8_t static_favicon_ico_end[] asm("_binary_favicon_ico_end");

extern const uint8_t static_favicon_png_start[] asm("_binary_favicon_png_start");
extern const uint8_t static_favicon_png_end[] asm("_binary_favicon_png_end");

// Theme files
extern const uint8_t themes_Linear_png_start[] asm("_binary_Linear_png_start");
extern const uint8_t themes_Linear_png_end[] asm("_binary_Linear_png_end");

extern const uint8_t themes_Radial_png_start[] asm("_binary_Radial_png_start");
extern const uint8_t themes_Radial_png_end[] asm("_binary_Radial_png_end");

extern const uint8_t themes_Stock_RS_png_start[] asm("_binary_Stock_RS_png_start");
extern const uint8_t themes_Stock_RS_png_end[] asm("_binary_Stock_RS_png_end");

extern const uint8_t themes_Stock_ST_png_start[] asm("_binary_Stock_ST_png_start");
extern const uint8_t themes_Stock_ST_png_end[] asm("_binary_Stock_ST_png_end");

extern const uint8_t themes_Bar_Aurora_png_start[] asm("_binary_Bar_Aurora_png_start");
extern const uint8_t themes_Bar_Aurora_png_end[] asm("_binary_Bar_Aurora_png_end");

// Embedded file mappings
static const EmbeddedFile embedded_files[] = {
    {"/", static_index_html_start, static_index_html_end, "text/html"},
    {"/index.html", static_index_html_start, static_index_html_end, "text/html"},

    // Basic static files
    {"/favicon.png", static_favicon_png_start, static_favicon_png_end, "image/png"},
    {"/favicon.ico", static_favicon_ico_start, static_favicon_ico_end, "image/x-icon"},

    // Theme images (dashboard themes)
    {"/api/embedded/Linear.png", themes_Linear_png_start, themes_Linear_png_end, "image/png"},
    {"/api/embedded/Radial.png", themes_Radial_png_start, themes_Radial_png_end, "image/png"},
    {"/api/embedded/Stock RS.png", themes_Stock_RS_png_start, themes_Stock_RS_png_end, "image/png"},
    {"/api/embedded/Stock ST.png", themes_Stock_ST_png_start, themes_Stock_ST_png_end, "image/png"},
    {"/api/embedded/Bar Aurora.png", themes_Bar_Aurora_png_start, themes_Bar_Aurora_png_end, "image/png"},
};

#define EMBEDDED_FILE_COUNT (sizeof(embedded_files) / sizeof(EmbeddedFile))
#define HTTPD_TASK_STACK_SIZE (8192)

// Decode a URL-encoded string (e.g., "Stock%20ST.png" → "Stock ST.png")
void url_decode(char *dest, const char *src, size_t max_len)
{
    char a, b;
    size_t i = 0;

    while (*src && i < max_len - 1)
    {
        if ((*src == '%') &&
            (a = src[1]) && (b = src[2]) &&
            isxdigit(a) && isxdigit(b))
        {
            char hex[3] = {a, b, '\0'};
            dest[i++] = (char)strtol(hex, NULL, 16);
            src += 3;
        }
        else if (*src == '+')
        {
            dest[i++] = ' ';
            src++;
        }
        else
        {
            dest[i++] = *src++;
        }
    }

    dest[i] = '\0';
}

esp_err_t embedded_file_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "EMBEDDED_FILE_HANDLER: Checking for embedded file: %s", req->uri);

    char decoded[128];
    const char *encoded = req->uri + strlen("/api/embedded/");
    url_decode(decoded, encoded, sizeof(decoded));

    char expected_path[128];
    snprintf(expected_path, sizeof(expected_path), "/api/embedded/%.*s", (int)(sizeof(expected_path) - strlen("/api/embedded/") - 1), decoded);
    ESP_LOGI(TAG, "Decoded URI: %s", expected_path);

    for (int i = 0; i < EMBEDDED_FILE_COUNT; i++)
    {
        // Match against the decoded name (e.g. "Stock ST.png")
        if (strcmp(expected_path, embedded_files[i].path) == 0)
        {
            ESP_LOGI(TAG, "Serving embedded file: %s", embedded_files[i].path);

            httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
            httpd_resp_set_type(req, embedded_files[i].mime_type);

            size_t file_size = embedded_files[i].end - embedded_files[i].start;
            ESP_LOGI(TAG, "File size: %zu bytes", file_size);

            const size_t chunk_size = 4096;
            size_t bytes_remaining = file_size;
            const uint8_t *file_ptr = embedded_files[i].start;

            while (bytes_remaining > 0)
            {
                size_t bytes_to_send = (bytes_remaining > chunk_size) ? chunk_size : bytes_remaining;

                esp_err_t ret = httpd_resp_send_chunk(req, (const char *)file_ptr, bytes_to_send);
                if (ret != ESP_OK)
                {
                    ESP_LOGE(TAG, "File sending failed: %s", esp_err_to_name(ret));
                    return ret;
                }

                file_ptr += bytes_to_send;
                bytes_remaining -= bytes_to_send;
                if (bytes_remaining > 0)
                {
                    vTaskDelay(1 / portTICK_PERIOD_MS);
                }
            }

            return httpd_resp_send_chunk(req, NULL, 0);
        }
    }

    return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "Embedded file not found");
}

static bool is_spa_route(const char *uri)
{
    const char *dot = strrchr(uri, '.');
    return dot == NULL; // No file extension
}

esp_err_t web_request_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "WEB_REQUEST_HANDLER: Handling request: %s", req->uri);

    // Redirect `/` to `/index.html`
    if (strcmp(req->uri, "/") == 0)
    {
        ESP_LOGI(TAG, "Root request received, serving /index.html");

        httpd_resp_set_type(req, "text/html");
        return httpd_resp_send(req, (const char *)static_index_html_start, static_index_html_end - static_index_html_start);
    }

    // Fast favicon handling - common browser requests
    if (strcmp(req->uri, "/favicon.ico") == 0)
    {
        ESP_LOGI(TAG, "Serving favicon.ico");
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
        httpd_resp_set_type(req, "image/x-icon");
        return httpd_resp_send(req, (const char *)static_favicon_ico_start, static_favicon_ico_end - static_favicon_ico_start);
    }

    if (strcmp(req->uri, "/favicon.png") == 0)
    {
        ESP_LOGI(TAG, "Serving favicon.png");
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
        httpd_resp_set_type(req, "image/png");
        return httpd_resp_send(req, (const char *)static_favicon_png_start, static_favicon_png_end - static_favicon_png_start);
    }

    // Check if this is an embedded file first (for asset requests)
    for (int i = 0; i < EMBEDDED_FILE_COUNT; i++)
    {
        if (strcmp(req->uri, embedded_files[i].path) == 0)
        {
            ESP_LOGI(TAG, "Serving embedded file from general handler: %s", embedded_files[i].path);

            httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
            httpd_resp_set_type(req, embedded_files[i].mime_type);

            size_t file_size = embedded_files[i].end - embedded_files[i].start;
            ESP_LOGI(TAG, "File size: %zu bytes", file_size);

            const size_t chunk_size = 4096;
            size_t bytes_remaining = file_size;
            const uint8_t *file_ptr = embedded_files[i].start;

            while (bytes_remaining > 0)
            {
                size_t bytes_to_send = (bytes_remaining > chunk_size) ? chunk_size : bytes_remaining;

                esp_err_t ret = httpd_resp_send_chunk(req, (const char *)file_ptr, bytes_to_send);
                if (ret != ESP_OK)
                {
                    ESP_LOGE(TAG, "File sending failed: %s", esp_err_to_name(ret));
                    return ret;
                }

                file_ptr += bytes_to_send;
                bytes_remaining -= bytes_to_send;
                if (bytes_remaining > 0)
                {
                    vTaskDelay(1 / portTICK_PERIOD_MS);
                }
            }

            return httpd_resp_send_chunk(req, NULL, 0);
        }
    }

    // Serve index.html only for likely SPA routes
    if (is_spa_route(req->uri))
    {
        ESP_LOGW(TAG, "SPA route fallback: serving index.html for %s", req->uri);
        httpd_resp_set_type(req, "text/html");
        return httpd_resp_send(req, (const char *)static_index_html_start, static_index_html_end - static_index_html_start);
    }

    // If it's a file-like path and not found earlier, return 404
    ESP_LOGW(TAG, "Not found: %s", req->uri);
    return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "File not found");
}

esp_err_t sveltekit_version_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "Handling request: %s", req->uri);
    ESP_LOGI(TAG, "Serving SvelteKit version: %s", APP_VERSION_STRING);
    ESP_LOGI(TAG, "VERSION_JSON_RESPONSE: %s", VERSION_JSON_RESPONSE);

    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache");
    static const char version_json[] = VERSION_JSON_RESPONSE;
    return httpd_resp_send(req, version_json, strlen(version_json));
}

esp_err_t start_webserver()
{
    httpd_handle_t server = NULL;

    ESP_LOGI(TAG, "Starting HTTP server...");

    // Configure HTTP server
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.stack_size = HTTPD_TASK_STACK_SIZE;
    config.max_uri_handlers = 24;  // Increased to accommodate all routes
    config.uri_match_fn = httpd_uri_match_wildcard;

    if (httpd_start(&server, &config) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to start HTTP server");
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "HTTP Server started successfully on port 80");

    if (register_images(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register user images");
        httpd_stop(server);
        return ESP_FAIL;
    }

    if (config_handler_init_buffer() != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to init config buffers");
        httpd_stop(server);
        return ESP_FAIL;
    }

    if (pids_handler_init_buffer() != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to init PIDs config buffers");
        httpd_stop(server);
        return ESP_FAIL;
    }

    if (register_config_routes(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register config endpoints");
        httpd_stop(server);
        return ESP_FAIL;
    }

    if (register_pids_routes(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register PIDs endpoints");
        httpd_stop(server);
        return ESP_FAIL;
    }

    if (register_ota_routes(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register OTA endpoints");
        httpd_stop(server);
        return ESP_FAIL;
    }

    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/api/embedded/*",
                                           .method = HTTP_GET,
                                           .handler = embedded_file_handler,
                                           .user_ctx = NULL});

    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/api/images/*",
                                           .method = HTTP_GET,
                                           .handler = spiffs_file_handler,
                                           .user_ctx = NULL});

    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/_app/version.json",
                                           .method = HTTP_GET,
                                           .handler = sveltekit_version_handler,
                                           .user_ctx = NULL});

    // Register specific API routes BEFORE the catch-all handler
    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/api/firmware-version",
                                           .method = HTTP_GET,
                                           .handler = sveltekit_version_handler,
                                           .user_ctx = NULL});

    if (register_spiffs(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register SPIFFS endpoints");
        httpd_stop(server);
        return ESP_FAIL;
    }

    // Register catch-all handler LAST so specific routes are matched first
    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/*",
                                           .method = HTTP_GET,
                                           .handler = web_request_handler,
                                           .user_ctx = NULL});

    ESP_LOGI(TAG, "Web server started successfully");
    return ESP_OK;
}
