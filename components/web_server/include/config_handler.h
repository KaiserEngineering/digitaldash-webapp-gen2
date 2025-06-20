#ifndef CONFIG_HANDLER_H
#define CONFIG_HANDLER_H

#include "esp_http_server.h"
#include "esp_err.h"

#define JSON_BUF_SIZE 1024

// Declare, don't define
extern char json_data_input[JSON_BUF_SIZE];
extern char json_data_output[JSON_BUF_SIZE];

esp_err_t config_get_handler(httpd_req_t *req);
esp_err_t config_patch_handler(httpd_req_t *req);
esp_err_t register_config_routes(httpd_handle_t server);

#endif // CONFIG_HANDLER_H