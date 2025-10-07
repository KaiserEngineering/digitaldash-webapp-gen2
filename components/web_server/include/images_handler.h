#ifndef IMAGES_HANDLER_H
#define IMAGES_HANDLER_H

#include "esp_http_server.h"

/**
 * @brief Handler for fetching all user-uploaded images from SPIFFS.
 * @param req HTTP request
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t images_list_handler(httpd_req_t *req);

/**
 * @brief Handler for fetching a specific user-uploaded image.
 * @param req HTTP request containing the image filename.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t image_get_handler(httpd_req_t *req);

/**
 * @brief Handler for uploading a new user image.
 * @param req HTTP request containing the image file.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t image_post_handler(httpd_req_t *req);

/**
 * @brief Handler for deleting a user-uploaded image.
 * @param req HTTP request specifying the image filename.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t image_delete_handler(httpd_req_t *req);

/**
 * @brief Registers user image-related HTTP endpoints in the web server.
 * @param server Pointer to the HTTP server instance.
 * @return ESP_OK on success, ESP_FAIL otherwise.
 */
esp_err_t register_images(httpd_handle_t server);

#endif // USER_IMAGES_H
