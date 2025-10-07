// stm_gpio.h
#ifndef STM_GPIO_H
#define STM_GPIO_H

#include <stdint.h>
#include <stdbool.h>
#include "driver/gpio.h"
#include "sdkconfig.h"

// Define the pin externally or make sure it's defined in your build system
#ifndef CONFIG_STM32_SPLASH_EN_PIN
#error "CONFIG_STM32_SPLASH_EN_PIN must be defined"
#endif

#ifdef __cplusplus
extern "C" {
#endif

void stm_gpio_splash_disable(bool enable);

#ifdef __cplusplus
}
#endif

#endif // STM_GPIO_H
