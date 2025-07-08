#ifndef CONFIG_HANDLER_H
#define CONFIG_HANDLER_H

#include "lib_ke_protocol.h"
#include "esp_http_server.h"
#include "esp_err.h"

void get_json_data_input_info(char **ptr, uint32_t *max_len);
void get_json_data_output_info(char **ptr, uint32_t *max_len);
void get_option_list_info(char **ptr, uint32_t *max_len);
void get_pid_list_info(char **ptr, uint32_t *max_len);
void Generate_TX_Message( PKE_PACKET_MANAGER dev, KE_CP_OP_CODES cmd, void *args );
bool receive_config(const char *json_str);
KE_PACKET_MANAGER *get_stm32_comm(void);

esp_err_t config_options_handler(httpd_req_t *req);
esp_err_t config_get_handler(httpd_req_t *req);
esp_err_t config_patch_handler(httpd_req_t *req);
esp_err_t register_config_routes(httpd_handle_t server);
esp_err_t config_handler_init_buffer(void);

#endif // CONFIG_HANDLER_H