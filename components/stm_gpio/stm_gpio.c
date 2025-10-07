// stm_gpio.h
#ifndef STM_GPIO_H
#define STM_GPIO_H

#include <stdint.h>
#include <stdbool.h>
#include "driver/gpio.h"

#ifndef CONFIG_STM32_SPLASH_EN_PIN
#error "CONFIG_STM32_SPLASH_EN_PIN must be defined in sdkconfig or build system"
#endif

#ifdef __cplusplus
extern "C" {
#endif

void stm_gpio_splash_disable(bool enable)
{
    if( enable )
        gpio_set_level(CONFIG_STM32_SPLASH_EN_PIN, 1);
    else
        gpio_set_level(CONFIG_STM32_SPLASH_EN_PIN, 0);
}


#ifdef __cplusplus
}
#endif

#endif // STM_GPIO_H
