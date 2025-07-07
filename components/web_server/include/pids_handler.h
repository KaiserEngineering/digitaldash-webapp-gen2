#ifndef PIDS_HANDLER_H
#define PIDS_HANDLER_H

#include "esp_http_server.h"
#include "esp_err.h"

void receive_pid_list(const char *json_str);

esp_err_t register_pids_routes(httpd_handle_t server);
esp_err_t config_pids_handler(httpd_req_t *req);
esp_err_t pids_handler_init_buffer(void);

#endif
