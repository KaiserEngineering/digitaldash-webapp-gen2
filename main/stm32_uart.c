#include "stm32_uart.h"

static const char *TAG = "UART";

void uart_init(void)
{
    const uart_config_t uart_config = {
        .baud_rate = CONFIG_ESP32_STM32_UART_BAUD,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_EVEN,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE};

    uart_driver_install(CONFIG_ESP32_STM32_UART_CONTROLLER, CONFIG_ESP32_STM32_UART_BUFFER_SIZE * 2, 0, 0, NULL, 0);

    uart_param_config(CONFIG_ESP32_STM32_UART_CONTROLLER, &uart_config);
    uart_set_pin(CONFIG_ESP32_STM32_UART_CONTROLLER, CONFIG_STM32_RX_ESP32_TX, CONFIG_STM32_TX_ESP32_RX, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);

    ESP_LOGI(TAG, "%s", "Initialized Flash UART");
}