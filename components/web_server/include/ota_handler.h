#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include "esp_http_server.h"

#ifdef __cplusplus
extern "C" {
#endif

void flash_stm32_firmware(const char *firmware_path);

/**
 * @brief Handler for OTA file uploads.
 *
 * This function processes an OTA file upload request.
 *
 * @param req The HTTP request structure.
 * @return esp_err_t ESP_OK on success, otherwise an error code.
 */
esp_err_t web_update_post_handler(httpd_req_t *req);

/**
 * @brief Registers OTA endpoints with the HTTP server.
 *
 * @param server The HTTP server handle.
 * @return esp_err_t ESP_OK on success, otherwise an error code.
 */
esp_err_t register_ota_routes(httpd_handle_t server);

esp_err_t stm_update_post_handler(httpd_req_t *req);

/**
 * @brief Handler for STM flash progress requests.
 *
 * @param req The HTTP request structure.
 * @return esp_err_t ESP_OK on success, otherwise an error code.
 */
esp_err_t stm_flash_progress_handler(httpd_req_t *req);

#ifdef __cplusplus
}
#endif

#endif // OTA_HANDLER_H
