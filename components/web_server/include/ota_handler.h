#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include "esp_http_server.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Handler for OTA file uploads.
 *
 * This function processes an OTA file upload request.
 *
 * @param req The HTTP request structure.
 * @return esp_err_t ESP_OK on success, otherwise an error code.
 */
esp_err_t update_post_handler(httpd_req_t *req);

/**
 * @brief Registers OTA endpoints with the HTTP server.
 *
 * @param server The HTTP server handle.
 * @return esp_err_t ESP_OK on success, otherwise an error code.
 */
esp_err_t register_ota_routes(httpd_handle_t server);

#ifdef __cplusplus
}
#endif

#endif // OTA_HANDLER_H
