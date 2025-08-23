#include "stm_flash.h"

static const char *TAG_STM_FLASH = "stm_flash";

#define WRITE_PROGRESS_START 0   // Start write progress at 0%
#define WRITE_PROGRESS_END   100  // End write progress at 100%

// Global progress tracking
static stm_flash_progress_t flash_progress = {0};

void stm32_reset(void)
{
    // Reset the STM32 (Inverse logic - connected to NFET)
    gpio_set_level(CONFIG_STM32_RESET_PIN, 1);
    ESP_LOGI(TAG_STM_FLASH, "Resetting STM32");

    // Enable the STM32 boots to application code
    gpio_set_level(CONFIG_STM32_BOOT_PIN, 0);
    ESP_LOGI(TAG_STM_FLASH, "Resetting STM32 BOOT0");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));

    // Release the STM32 from reset
    gpio_set_level(CONFIG_STM32_RESET_PIN, 0);
    ESP_LOGI(TAG_STM_FLASH, "Starting STM32");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));
}

void stm32_bootloader(void)
{
    // Reset the STM32 (Inverse logic - connected to NFET)
    gpio_set_level(CONFIG_STM32_RESET_PIN, 1);
    ESP_LOGI(TAG_STM_FLASH, "Resetting STM32");

    // Enable the STM32 to boot to the bootloader
    gpio_set_level(CONFIG_STM32_BOOT_PIN, 1);
    ESP_LOGI(TAG_STM_FLASH, "Setting STM32 BOOT0");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));

    // Release the STM32 from reset
    gpio_set_level(CONFIG_STM32_RESET_PIN, 0);
    ESP_LOGI(TAG_STM_FLASH, "Starting STM32");

    // Wait for the STM32 to reset
    vTaskDelay(pdMS_TO_TICKS(STM32_RESET_DELAY_MS));
}

esp_err_t writeTask(FILE *flash_file)
{
    logI(TAG_STM_FLASH, "%s", "Write Task");

    char loadAddress[4] = {0x08, 0x00, 0x00, 0x00};
    char block[256] = {0};
    int curr_block = 0, bytes_read = 0;

    // Get file size for progress calculation
    fseek(flash_file, 0, SEEK_END);
    long file_size = ftell(flash_file);
    fseek(flash_file, 0, SEEK_SET);

    if (file_size <= 0) {
        ESP_LOGE(TAG_STM_FLASH, "Invalid file size");
        set_stm_flash_error("Invalid file size");
        return ESP_FAIL;
    }

    int total_blocks = (file_size + 255) / 256; // Round up for total blocks
    if(setupSTM() == 0) {
        logE(TAG_STM_FLASH, "%s", "STM32 Setup failed");
        set_stm_flash_error("STM32 Setup failed");
        return ESP_FAIL;
    }

    update_stm_flash_progress(0, "Starting firmware write to STM32");

    int last_logged_progress = -1; // To prevent duplicate logging

    while ((bytes_read = fread(block, 1, sizeof(block), flash_file)) > 0)
    {
        curr_block++;

        esp_err_t ret = flashPage(loadAddress, block);
        if (ret == ESP_FAIL)
        {
            set_stm_flash_error("Failed to write block to STM32 flash");
            return ESP_FAIL;
        }

        // Compute progress percentage mapped to WRITE_PROGRESS_START → WRITE_PROGRESS_END
        long bytes_written = curr_block * sizeof(block);
        if (bytes_written > file_size) bytes_written = file_size; // clamp at EOF

        int progress = WRITE_PROGRESS_START +
                       (int)((bytes_written * (WRITE_PROGRESS_END - WRITE_PROGRESS_START)) / file_size);

        // Only log if we advanced at least 1%
        if (progress != last_logged_progress) {
            ESP_LOGI(TAG_STM_FLASH, "Write progress: %d%%", progress);
            char progress_msg[128];
            snprintf(progress_msg, sizeof(progress_msg), "Writing to flash...");
            update_stm_flash_progress(progress, progress_msg);
            last_logged_progress = progress;
        }

        incrementLoadAddress(loadAddress);
        memset(block, 0xff, 256);
    }

    return ESP_OK;
}

esp_err_t readTask(FILE *flash_file)
{
    logI(TAG_STM_FLASH, "%s", "Read & Verification Task");
    char readAddress[4] = {0x08, 0x00, 0x00, 0x00};

    char block[257] = {0};
    int curr_block = 0, bytes_read = 0;

    fseek(flash_file, 0, SEEK_SET);

    while ((bytes_read = fread(block, 1, 256, flash_file)) > 0)
    {
        curr_block++;
        logI(TAG_STM_FLASH, "Reading block: %d", curr_block);
        // ESP_LOG_BUFFER_HEXDUMP("Block:  ", block, sizeof(block), ESP_LOG_DEBUG);

        esp_err_t ret = readPage(readAddress, block);
        if (ret == ESP_FAIL)
        {
            return ESP_FAIL;
        }

        incrementLoadAddress(readAddress);

        memset(block, 0xff, 256);
    }

    return ESP_OK;
}

esp_err_t flashSTM(const char *file_name)
{
    esp_err_t err = ESP_FAIL;

    // Reset progress tracking
    reset_stm_flash_progress();

    char file_path[FILE_PATH_MAX];
    sprintf(file_path, "%s%s", BASE_PATH, file_name);
    logD(TAG_STM_FLASH, "File name: %s", file_path);

    // Put STM32 in bootloader mode
    stm32_bootloader();
    logI(TAG_STM_FLASH, "STM32 set to bootloader mode", NULL);

    FILE *flash_file = fopen(file_path, "rb");
    if (flash_file == NULL)
    {
        set_stm_flash_error("Failed to open firmware file");
        return ESP_FAIL;
    }


    // This while loop executes only once and breaks if any of the functions do not return ESP_OK
    do
    {
        logI(TAG_STM_FLASH, "%s", "Writing STM32 Memory");
        if (writeTask(flash_file) != ESP_OK)
        {
            err = ESP_FAIL;
            break;
        }

        /* 
        * Disbale read for now, still need to implement image verification
        * the normal use case baud rate is 921600B/s we are at 115200B/s for
        * the bootloader, so chances of UART bit corruption is relatively low
        * when running at 1/8th the speed.
        */
        //logI(TAG_STM_FLASH, "%s", "Reading STM32 Memory");
        //if (readTask(flash_file) != ESP_OK)
        //{
        //    err = ESP_FAIL;
        //    break;
        //}

        err = ESP_OK;
        logI(TAG_STM_FLASH, "%s", "STM32 Flashed Successfully!!!");
        set_stm_flash_complete();
    } while (0);

    logI(TAG_STM_FLASH, "%s", "Ending Connection");
    endConn();

    logI(TAG_STM_FLASH, "%s", "Closing file");
    fclose(flash_file);

    // If we failed but didn't set an error message, set a generic one
    if (err != ESP_OK && !flash_progress.error)
    {
        set_stm_flash_error("STM32 flash operation failed");
    }

    return err;
}

// Progress tracking functions
stm_flash_progress_t* get_stm_flash_progress(void)
{
    return &flash_progress;
}

void update_stm_flash_progress(int percentage, const char* message)
{
    flash_progress.percentage = percentage;
    if (message) {
        strncpy(flash_progress.message, message, sizeof(flash_progress.message) - 1);
        flash_progress.message[sizeof(flash_progress.message) - 1] = '\0';
    }
    flash_progress.complete = false;
    flash_progress.error = false;
}

void set_stm_flash_complete(void)
{
    flash_progress.percentage = 100;
    strncpy(flash_progress.message, "STM32 firmware flash completed successfully", sizeof(flash_progress.message) - 1);
    flash_progress.message[sizeof(flash_progress.message) - 1] = '\0';
    flash_progress.complete = true;
    flash_progress.error = false;
}

void set_stm_flash_error(const char* error_message)
{
    flash_progress.error = true;
    flash_progress.complete = false;
    if (error_message) {
        strncpy(flash_progress.error_message, error_message, sizeof(flash_progress.error_message) - 1);
        flash_progress.error_message[sizeof(flash_progress.error_message) - 1] = '\0';
        strncpy(flash_progress.message, error_message, sizeof(flash_progress.message) - 1);
        flash_progress.message[sizeof(flash_progress.message) - 1] = '\0';
    }
}

void reset_stm_flash_progress(void)
{
    memset(&flash_progress, 0, sizeof(flash_progress));
    strncpy(flash_progress.message, "Initializing STM32 flash", sizeof(flash_progress.message) - 1);
    flash_progress.message[sizeof(flash_progress.message) - 1] = '\0';
}
