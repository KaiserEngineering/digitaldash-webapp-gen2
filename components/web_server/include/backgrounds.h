#ifndef BACKGROUNDS_H
#define BACKGROUNDS_H

#include "esp_http_server.h"

/**
 * @brief Handler for fetching all background images from SPIFFS.
 * @param req HTTP request
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t background_get_handler(httpd_req_t *req);

/**
 * @brief Handler for uploading a new background image.
 * @param req HTTP request containing the image file.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t background_post_handler(httpd_req_t *req);

/**
 * @brief Handler for deleting a background image.
 * @param req HTTP request specifying the image filename.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t background_delete_handler(httpd_req_t *req);

/**
 * @brief Registers background-related HTTP endpoints in the web server.
 * @param server Pointer to the HTTP server instance.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t register_backgrounds(httpd_handle_t server);

#endif // BACKGROUNDS_H
