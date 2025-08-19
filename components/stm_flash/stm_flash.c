#include "stm_flash.h"

static const char *TAG_STM_FLASH = "stm_flash";

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

    int total_blocks = (file_size + 255) / 256; // Round up for total blocks
    setupSTM();

    update_stm_flash_progress(5, "Starting firmware write to STM32");

    while ((bytes_read = fread(block, 1, 256, flash_file)) > 0)
    {
        curr_block++;
        logI(TAG_STM_FLASH, "Writing block: %d of %d", curr_block, total_blocks);

        // Update progress (write takes 50% of total process)
        int progress = (curr_block * 50) / total_blocks;
        char progress_msg[128];
        snprintf(progress_msg, sizeof(progress_msg), "Writing block %d of %d", curr_block, total_blocks);
        update_stm_flash_progress(progress, progress_msg);

        esp_err_t ret = flashPage(loadAddress, block);
        if (ret == ESP_FAIL)
        {
            set_stm_flash_error("Failed to write block to STM32 flash");
            return ESP_FAIL;
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

    // Get file size for progress calculation
    fseek(flash_file, 0, SEEK_END);
    long file_size = ftell(flash_file);
    fseek(flash_file, 0, SEEK_SET);

    int total_blocks = (file_size + 255) / 256; // Round up for total blocks

    while ((bytes_read = fread(block, 1, 256, flash_file)) > 0)
    {
        curr_block++;
        logI(TAG_STM_FLASH, "Reading block: %d of %d", curr_block, total_blocks);

        // Update progress (verification takes remaining 50% of total process)
        int progress = 50 + (curr_block * 50) / total_blocks;
        char progress_msg[128];
        snprintf(progress_msg, sizeof(progress_msg), "Verifying block %d of %d", curr_block, total_blocks);
        update_stm_flash_progress(progress, progress_msg);

        esp_err_t ret = readPage(readAddress, block);
        if (ret == ESP_FAIL)
        {
            set_stm_flash_error("Failed to verify STM32 flash");
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

    initGPIO();

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

        logI(TAG_STM_FLASH, "%s", "Reading STM32 Memory");
        if (readTask(flash_file) != ESP_OK)
        {
            err = ESP_FAIL;
            break;
        }

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
