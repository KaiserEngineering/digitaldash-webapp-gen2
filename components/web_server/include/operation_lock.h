#ifndef OPERATION_LOCK_H
#define OPERATION_LOCK_H

#include "esp_err.h"
#include "esp_http_server.h"
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

bool web_operation_try_begin(const char *operation_name);
void web_operation_end(void);
bool web_operation_is_active(char *operation_name, size_t operation_name_size, uint32_t *elapsed_ms);
esp_err_t web_operation_status_handler(httpd_req_t *req);
esp_err_t web_operation_send_busy(httpd_req_t *req);

#ifdef __cplusplus
}
#endif

#endif // OPERATION_LOCK_H
