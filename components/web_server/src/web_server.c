#include <string.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include "BACKGROUNDS.h"
#include "esp_vfs.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_err.h"
#include "web_server.h"
#include "themes.h"
#include "backgrounds.h"
#include "ota_handler.h"

static const char *TAG = "WebServer";

// Embedded files
extern const uint8_t index_html_gz_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_html_gz_end[] asm("_binary_index_html_gz_end");
extern const uint8_t favicon_start[] asm("_binary_favicon_png_start");
extern const uint8_t favicon_end[] asm("_binary_favicon_png_end");

// Favicon handler
esp_err_t favicon_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "image/png");
    return httpd_resp_send(req, (const char *)favicon_start, favicon_end - favicon_start);
}

// Index page handler
esp_err_t index_html_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
    return httpd_resp_send(req, (const char *)index_html_gz_start, index_html_gz_end - index_html_gz_start);
}

#define REST_CHECK(a, str, goto_tag, ...)                                         \
    do                                                                            \
    {                                                                             \
        if (!(a))                                                                 \
        {                                                                         \
            ESP_LOGE(TAG, "%s(%d): " str, __FUNCTION__, __LINE__, ##__VA_ARGS__); \
            goto goto_tag;                                                        \
        }                                                                         \
    } while (0)

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 512)
#define SCRATCH_BUFSIZE (20480)

typedef struct rest_server_context
{
    char base_path[ESP_VFS_PATH_MAX + 1];
    char scratch[SCRATCH_BUFSIZE];
} rest_server_context_t;

#define CHECK_FILE_EXTENSION(filename, ext) (strcasecmp(&filename[strlen(filename) - strlen(ext)], ext) == 0)

/* Set HTTP response content type according to file extension */
static esp_err_t set_content_type_from_file(httpd_req_t *req, const char *filepath)
{
    const char *type = "text/plain";

    if (CHECK_FILE_EXTENSION(filepath, ".gz"))
    {
        httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
        char base_filepath[FILE_PATH_MAX];
        strlcpy(base_filepath, filepath, sizeof(base_filepath));
        base_filepath[strlen(filepath) - 3] = '\0'; // Remove ".gz"
        filepath = base_filepath;
    }

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

    httpd_resp_set_type(req, type);
    return ESP_OK;
}

/* Handle common GET requests */
static esp_err_t rest_common_get_handler(httpd_req_t *req)
{
    const char *uri = req->uri;

    // ✅ Allow API requests to be handled by their own registered handlers
    if (strncmp(uri, "/api/", 5) == 0)
    {
        ESP_LOGI(TAG, "API request detected: %s", uri);
        return ESP_ERR_NOT_FOUND; // Let the API handler process it
    }

    // ✅ Construct the full file path in SPIFFS
    char filepath[FILE_PATH_MAX];
    rest_server_context_t *rest_context = (rest_server_context_t *)req->user_ctx;
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    strlcat(filepath, uri, sizeof(filepath));

    // ✅ Attempt to open the requested static file
    int fd = open(filepath, O_RDONLY);
    if (fd >= 0)
    {
        ESP_LOGI(TAG, "Serving static file: %s", filepath);
        set_content_type_from_file(req, filepath);
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");

        // ✅ Serve the file contents
        char buffer[SCRATCH_BUFSIZE];
        ssize_t read_bytes;
        while ((read_bytes = read(fd, buffer, SCRATCH_BUFSIZE)) > 0)
        {
            if (httpd_resp_send_chunk(req, buffer, read_bytes) != ESP_OK)
            {
                close(fd);
                ESP_LOGE(TAG, "Failed to send file: %s", filepath);
                httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to send file");
                return ESP_FAIL;
            }
        }

        close(fd);
        httpd_resp_send_chunk(req, NULL, 0); // End the response
        return ESP_OK;
    }

    // ✅ If no static file found, serve `index.html.gz` (for frontend routes)
    ESP_LOGW(TAG, "Static file not found: %s. Serving index.html.gz while keeping URL", uri);
    return index_html_handler(req);
}

// Start webserver
esp_err_t start_webserver()
{
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;
    ESP_LOGI(TAG, "Starting HTTP Server");

    rest_server_context_t *rest_context = calloc(1, sizeof(rest_server_context_t));
    REST_CHECK(rest_context, "Failed to allocate memory for REST context", err);

    strlcpy(rest_context->base_path, "/spiffs/data", sizeof(rest_context->base_path));

    if (httpd_start(&server, &config) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to start HTTP server");
        free(rest_context);
        return ESP_FAIL;
    }

    // if (register_themes(server) != ESP_OK)
    // {
    //     ESP_LOGE(TAG, "Failed to register themes");
    //     httpd_stop(server);
    //     free(rest_context);
    //     return ESP_FAIL;
    // }

    if (register_backgrounds(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register backgrounds");
        httpd_stop(server);
        free(rest_context);
        return ESP_FAIL;
    }

    // if (register_ota_routes(server) != ESP_OK)
    // {
    //     ESP_LOGE(TAG, "Failed to register OTA routes");
    //     httpd_stop(server);
    //     free(rest_context);
    //     return ESP_FAIL;
    // }

    httpd_register_uri_handler(server, &(httpd_uri_t){.uri = "/*", .method = HTTP_GET, .handler = rest_common_get_handler, .user_ctx = rest_context, .is_websocket = false});

    ESP_LOGI(TAG, "HTTP Server started successfully");
    return ESP_OK;

err:
    if (rest_context)
        free(rest_context);
    return ESP_FAIL;
}
