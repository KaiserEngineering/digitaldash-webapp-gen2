#ifndef _STM_FLASH_H
#define _STM_FLASH_H

#include "stm_pro_mode.h"

// Delay in milliseconds to hold STM32 in reset
#define STM32_RESET_DELAY_MS 100

/**
 * @brief STM flash progress structure
 */
typedef struct {
    int percentage;         // Progress percentage (0-100)
    char message[128];      // Progress message
    bool complete;          // Whether the operation is complete
    bool error;             // Whether an error occurred
    char error_message[128]; // Error message if error occurred
} stm_flash_progress_t;

/**
 * @brief Reset STM32 and boot into application mode (BOOT0 = 0)
 */
void stm32_reset(void);

/**
 * @brief Reset STM32 and boot into system bootloader (BOOT0 = 1)
 */
void stm32_bootloader(void);

/**
 * @brief Write the code into the flash memory of STM32Fxx
 * 
 * The data from the .bin file is written into the flash memory 
 * of the client, block-by-block 
 *
 * @param flash_file File pointer of the .bin file to be flashed
 *
 * @return ESP_OK - success, ESP_FAIL - failed
 */
esp_err_t writeTask(FILE *flash_file);

/**
 * @brief Read the flash memory of the STM32Fxx, for verification
 *
 * It reads the flash memory of the STM32 block-by-block and 
 * checks it with the data from the file (with pointer passed)
 *
 * @param flash_file File pointer of the .bin file to be verified against
 *
 * @return ESP_OK - success, ESP_FAIL - failed
 */
esp_err_t readTask(FILE *flash_file);

/**
 * @brief Flash the .bin file passed, to STM32Fxx, with read verification
 *
 * @param file_name name of the .bin to be flashed
 *
 * @return ESP_OK - success, ESP_FAIL - failed
 */
esp_err_t flashSTM(const char *file_name);

/**
 * @brief Get current STM flash progress
 *
 * @return Pointer to current progress structure
 */
stm_flash_progress_t* get_stm_flash_progress(void);

/**
 * @brief Update STM flash progress
 *
 * @param percentage Progress percentage (0-100)
 * @param message Progress message
 */
void update_stm_flash_progress(int percentage, const char* message);

/**
 * @brief Set STM flash as complete
 */
void set_stm_flash_complete(void);

/**
 * @brief Set STM flash error
 *
 * @param error_message Error message
 */
void set_stm_flash_error(const char* error_message);

/**
 * @brief Reset STM flash progress to initial state
 */
void reset_stm_flash_progress(void);

#endif
