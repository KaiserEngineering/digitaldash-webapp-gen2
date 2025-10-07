#include "stm32_uart.h"
#include "driver/uart.h"
#include "esp_log.h"

#define DEBUG_UART_RX 0

static const char *TAG = "UART";
static QueueHandle_t uart_event_queue;
static bool uart_initialized = false;
static TaskHandle_t uart_task_handle = NULL;

void uart_event_task(void *pvParameters)
{
    uart_event_t event;
    uint8_t rx_data;

    PKE_PACKET_MANAGER dev = (PKE_PACKET_MANAGER)pvParameters;

    while (1) {
        // Wait for UART event from ISR
        if (xQueueReceive(uart_event_queue, &event, portMAX_DELAY)) {
            switch (event.type) {
                case UART_DATA:
                    // DMA has received some bytes — process them one at a time
                    while (uart_read_bytes(CONFIG_ESP32_STM32_UART_CONTROLLER, &rx_data, 1, 0) > 0) {
                        KE_Add_UART_Byte(dev, rx_data);
#if DEBUG_UART_RX
                        ESP_LOGI(TAG, "RX Char: %c", rx_data);
#endif
                    }
                    break;

                case UART_FIFO_OVF:
                    ESP_LOGW(TAG, "UART FIFO Overflow");
                    uart_flush_input(CONFIG_ESP32_STM32_UART_CONTROLLER);
                    xQueueReset(uart_event_queue);
                    break;

                case UART_BUFFER_FULL:
                    ESP_LOGW(TAG, "UART RX Buffer Full");
                    uart_flush_input(CONFIG_ESP32_STM32_UART_CONTROLLER);
                    xQueueReset(uart_event_queue);
                    break;

                case UART_BREAK:
                    ESP_LOGW(TAG, "UART Break Detected");
                    break;

                case UART_PARITY_ERR:
                case UART_FRAME_ERR:
                    ESP_LOGE(TAG, "UART Frame/Parity Error");
                    break;

                default:
                    break;
            }
        }
    }
}

void uart_init(PKE_PACKET_MANAGER dev_ptr)
{
    if (uart_initialized) {
        ESP_LOGI(TAG, "UART already initialized. Deinitializing first.");
        // Delete task if already running
        if (uart_task_handle) {
            vTaskDelete(uart_task_handle);
            uart_task_handle = NULL;
        }

        // Delete UART driver
        uart_driver_delete(CONFIG_ESP32_STM32_UART_CONTROLLER);
        uart_event_queue = NULL;
        uart_initialized = false;
    }

    const uart_config_t uart_config = {
        .baud_rate = 921600,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_EVEN,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB,
    };

    const int uart_buffer_size = CONFIG_ESP32_STM32_UART_BUFFER_SIZE;

    ESP_ERROR_CHECK(uart_driver_install(CONFIG_ESP32_STM32_UART_CONTROLLER,
                                        uart_buffer_size * 2,
                                        uart_buffer_size * 2,
                                        40,
                                        &uart_event_queue,
                                        0));

    ESP_ERROR_CHECK(uart_param_config(CONFIG_ESP32_STM32_UART_CONTROLLER, &uart_config));

    ESP_ERROR_CHECK(uart_set_pin(CONFIG_ESP32_STM32_UART_CONTROLLER,
                                 CONFIG_STM32_RX_ESP32_TX,
                                 CONFIG_STM32_TX_ESP32_RX,
                                 UART_PIN_NO_CHANGE,
                                 UART_PIN_NO_CHANGE));

    ESP_ERROR_CHECK(uart_flush_input(CONFIG_ESP32_STM32_UART_CONTROLLER));

    // Start the RX event task (FIXED)
    BaseType_t task_ok = xTaskCreate(uart_event_task,
                                    "uart_event_task",       // name
                                    4096,                    // stack size
                                    dev_ptr,                 // param
                                    12,                      // priority
                                    &uart_task_handle);      // out handle
    if (task_ok != pdPASS) {
        ESP_LOGE(TAG, "Failed to create UART RX task");
        return;
    }


    uart_initialized = true;
    ESP_LOGI(TAG, "UART DMA Initialized for RX/TX on UART%d", CONFIG_ESP32_STM32_UART_CONTROLLER);
}

void uart_init_for_stm32_bootloader(void)
{
    // Deinit if already initialized
    if (uart_initialized) {
        ESP_LOGI(TAG, "UART already initialized. Deinitializing first.");
        // Delete task if already running
        if (uart_task_handle) {
            vTaskDelete(uart_task_handle);
            uart_task_handle = NULL;
        }

        // Delete UART driver
        uart_driver_delete(CONFIG_ESP32_STM32_UART_CONTROLLER);
        uart_event_queue = NULL;
        uart_initialized = false;
    }

    // Set up UART config
    const uart_config_t uart_config = {
        .baud_rate = 115200,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_EVEN,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB,
    };

    // Install driver (no RX queue, TX buffer size = 0, polling only)
    ESP_ERROR_CHECK(uart_driver_install(CONFIG_ESP32_STM32_UART_CONTROLLER,
                                        CONFIG_ESP32_STM32_UART_BUFFER_SIZE * 2,
                                        0, 0, NULL, 0));

    ESP_ERROR_CHECK(uart_param_config(CONFIG_ESP32_STM32_UART_CONTROLLER, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(CONFIG_ESP32_STM32_UART_CONTROLLER,
                                 CONFIG_STM32_RX_ESP32_TX,
                                 CONFIG_STM32_TX_ESP32_RX,
                                 UART_PIN_NO_CHANGE,
                                 UART_PIN_NO_CHANGE));

    uart_initialized = true;
    ESP_LOGI(TAG, "Initialized Flash UART");
}