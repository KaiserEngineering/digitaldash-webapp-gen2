#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include "esp_http_server.h"
#include "lib_ke_protocol.h"

#ifdef __cplusplus
extern "C" {
#endif

KE_PACKET_MANAGER *get_stm32_comm(void);

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

/**
 * @brief   Retrieve the next chunk of binary firmware data for transmission.
 *
 * This function fills the provided buffer with up to @p buffer_size bytes of
 * binary data from the firmware image being transferred (e.g. over UART or another
 * transport layer). The function is typically called in a loop until the full
 * image has been sent.
 *
 * @param[out] buffer       Pointer to the buffer where the chunk data will be written.
 * @param[in]  buffer_size  Maximum number of bytes to copy into @p buffer.
 *
 * @return  Number of bytes actually written into @p buffer.
 *          Returns 0 if no more data is available (end of binary reached).
 *
 * @note    The caller is responsible for repeatedly invoking this function
 *          until it returns 0, indicating the transfer is complete.
 */
uint32_t get_binary_chunk_data(char *buffer, uint32_t buffer_size);

#ifdef __cplusplus
}
#endif

#endif // OTA_HANDLER_H
