#include <string.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include "esp_vfs.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_err.h"
#include "backgrounds.h"

static const char *TAG = "WebServer";

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 512)
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
extern const uint8_t index_html_gz_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_html_gz_end[] asm("_binary_index_html_gz_end");

extern const uint8_t favicon_start[] asm("_binary_favicon_png_start");
extern const uint8_t favicon_end[] asm("_binary_favicon_png_end");

extern const uint8_t flare_png_start[] asm("_binary_flare_png_gz_start");
extern const uint8_t flare_png_end[] asm("_binary_flare_png_gz_end");

extern const uint8_t galaxy_png_start[] asm("_binary_galaxy_png_gz_start");
extern const uint8_t galaxy_png_end[] asm("_binary_galaxy_png_gz_end");

// Embedded file mappings
static const EmbeddedFile embedded_files[] = {
    {"/", index_html_gz_start, index_html_gz_end, "text/html"},
    {"/index.html.gz", index_html_gz_start, index_html_gz_end, "text/html"},
    {"/favicon.png", favicon_start, favicon_end, "image/png"},
    {"/backgrounds/flare.png.gz", flare_png_start, flare_png_end, "image/png"},
    {"/backgrounds/galaxy.png.gz", galaxy_png_start, galaxy_png_end, "image/png"},
};

#define EMBEDDED_FILE_COUNT (sizeof(embedded_files) / sizeof(EmbeddedFile))
#define HTTPD_TASK_STACK_SIZE (8192)

// ✅ Serve embedded files
esp_err_t embedded_file_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "Checking for embedded file: %s", req->uri);

    for (int i = 0; i < EMBEDDED_FILE_COUNT; i++)
    {
        if (strcmp(req->uri, embedded_files[i].path) == 0)
        {
            ESP_LOGI(TAG, "Serving embedded file: %s", embedded_files[i].path);

            httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
            httpd_resp_set_type(req, embedded_files[i].mime_type);
            if (CHECK_FILE_EXTENSION(req->uri, ".gz"))
            {
                httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
            }

            return httpd_resp_send(req, (const char *)embedded_files[i].start,
                                   embedded_files[i].end - embedded_files[i].start);
        }
    }

    return ESP_ERR_NOT_FOUND;
}

// ✅ Set content type based on file extension
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

// ✅ Serve SPIFFS files
static esp_err_t spiffs_file_handler(httpd_req_t *req)
{
    char filepath[FILE_PATH_MAX];
    snprintf(filepath, sizeof(filepath), "/spiffs%s", req->uri);

    int fd = open(filepath, O_RDONLY);
    if (fd >= 0)
    {
        ESP_LOGI(TAG, "Serving SPIFFS file: %s", filepath);
        set_content_type_from_file(req, filepath);
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");

        // Send file contents
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
        httpd_resp_send_chunk(req, NULL, 0); // End response
        return ESP_OK;
    }
    return ESP_ERR_NOT_FOUND;
}

// ✅ Unified Request Handler
esp_err_t web_request_handler(httpd_req_t *req)
{
    ESP_LOGI(TAG, "Handling request: %s", req->uri);

    // 1️⃣ API Requests → Let another handler process them
    if (strncmp(req->uri, "/api/", 5) == 0)
    {
        ESP_LOGE(TAG, "API request not handled: %s", req->uri);
        return httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, "API endpoint not found");
    }

    // 2️⃣ Redirect `/` to `/index.html.gz`
    if (strcmp(req->uri, "/") == 0)
    {
        ESP_LOGI(TAG, "Root request received, serving /index.html.gz");

        httpd_resp_set_type(req, "text/html");
        httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
        return httpd_resp_send(req, (const char *)index_html_gz_start, index_html_gz_end - index_html_gz_start);
    }

    // 3️⃣ Serve Embedded Files → If Found
    if (embedded_file_handler(req) == ESP_OK)
    {
        return ESP_OK;
    }

    // 4️⃣ Serve SPIFFS Files → If Found
    if (spiffs_file_handler(req) == ESP_OK)
    {
        return ESP_OK;
    }

    // 5️⃣ Default: Serve `index.html.gz` as a fallback
    ESP_LOGW(TAG, "File not found: %s. Serving index.html.gz as fallback", req->uri);

    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
    return httpd_resp_send(req, (const char *)index_html_gz_start, index_html_gz_end - index_html_gz_start);
}

// ✅ Start Webserver
esp_err_t start_webserver()
{
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.stack_size = HTTPD_TASK_STACK_SIZE;
    config.uri_match_fn = httpd_uri_match_wildcard;

    ESP_LOGI(TAG, "Starting HTTP Server");

    if (httpd_start(&server, &config) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to start HTTP server");
        return ESP_FAIL;
    }

    // ✅ Now register background APIs
    if (register_backgrounds(server) != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to register backgrounds");
        httpd_stop(server);
        return ESP_FAIL;
    }

    // ✅ First, register the main web request handler
    httpd_register_uri_handler(server, &(httpd_uri_t){
                                           .uri = "/*",
                                           .method = HTTP_GET,
                                           .handler = web_request_handler,
                                           .user_ctx = NULL});

    ESP_LOGI(TAG, "HTTP Server started successfully");
    return ESP_OK;
}
