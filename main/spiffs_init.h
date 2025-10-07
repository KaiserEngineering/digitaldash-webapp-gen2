#ifndef SPIFFS_INIT_H
#define SPIFFS_INIT_H

#include "esp_err.h"
#include <stddef.h>

void init_spiffs(void);
void list_spiffs_files(void);
esp_err_t get_spiffs_usage_info(size_t *total, size_t *used);

#endif
