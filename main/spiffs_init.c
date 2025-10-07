#include "esp_log.h"
#include "esp_spiffs.h"
#include "sys/dirent.h"
#include <stdio.h>
#include <string.h>

static const char *TAG = "SPIFFS";

void init_spiffs(void)
{
    esp_vfs_spiffs_conf_t conf = {
        .base_path = "/spiffs",
        .partition_label = NULL,
        .max_files = 25,
        .format_if_mount_failed = true};

    esp_err_t ret = esp_vfs_spiffs_register(&conf);
    if (ret != ESP_OK)
    {
        if (ret == ESP_FAIL)
        {
            ESP_LOGE(TAG, "Failed to mount or format SPIFFS");
        }
        else if (ret == ESP_ERR_NOT_FOUND)
        {
            ESP_LOGE(TAG, "Failed to find SPIFFS partition");
        }
        else
        {
            ESP_LOGE(TAG, "Failed to initialize SPIFFS (%s)", esp_err_to_name(ret));
        }
        return;
    }

    size_t total = 0, used = 0;
    ret = esp_spiffs_info(NULL, &total, &used);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to get SPIFFS partition information (%s)", esp_err_to_name(ret));
    }
    else
    {
        ESP_LOGI(TAG, "SPIFFS mounted successfully. Total: %zu bytes, Used: %zu bytes", total, used);
    }
}

void list_spiffs_files()
{
    ESP_LOGI("SPIFFS", "Listing files in SPIFFS:");
    DIR *dir = opendir("/spiffs");
    if (!dir)
    {
        ESP_LOGE("SPIFFS", "Failed to open directory");
        return;
    }
    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL)
    {
        ESP_LOGI("SPIFFS", "Found file: %s", entry->d_name);
    }
    closedir(dir);
}

esp_err_t get_spiffs_usage_info(size_t *total, size_t *used)
{
    if (!total || !used) {
        return ESP_ERR_INVALID_ARG;
    }

    esp_err_t ret = esp_spiffs_info(NULL, total, used);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get SPIFFS usage info: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "SPIFFS usage - Total: %zu bytes, Used: %zu bytes (%.1f%%)",
             *total, *used, *total > 0 ? ((float)*used / (float)*total) * 100.0f : 0.0f);
    return ESP_OK;
}
