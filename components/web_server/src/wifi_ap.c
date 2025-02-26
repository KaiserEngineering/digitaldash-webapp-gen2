#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include <string.h>
#include "mdns.h"
#include "esp_netif.h"
#include "lwip/ip4_addr.h"

#define SSID "DigitalDash"
#define PASSWORD "FordFocusSTRS"

// Set static IP for AP mode
static const char *TAG = "WiFi_AP";

void wifi_init_softap(void)
{
    esp_netif_init();
    esp_event_loop_create_default();

    // Create AP netif
    esp_netif_t *netif_ap = esp_netif_create_default_wifi_ap();

    // Configure static IP
    esp_netif_ip_info_t ip_info;
    IP4_ADDR(&ip_info.ip, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.gw, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.netmask, 255, 255, 255, 0);

    esp_netif_dhcps_stop(netif_ap); // Stop DHCP server to set static IP
    esp_netif_set_ip_info(netif_ap, &ip_info);
    esp_netif_dhcps_start(netif_ap); // Restart DHCP server

    // Initialize Wi-Fi
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    wifi_config_t wifi_ap_config = {
        .ap = {
            .ssid = SSID,
            .ssid_len = strlen(SSID),
            .channel = 2,
            .password = PASSWORD,
            .max_connection = 4,
            .authmode = WIFI_AUTH_WPA_WPA2_PSK},
    };

    if (strlen(PASSWORD) == 0)
    {
        wifi_ap_config.ap.authmode = WIFI_AUTH_OPEN;
    }

    esp_wifi_set_mode(WIFI_MODE_AP);
    esp_wifi_set_config(WIFI_IF_AP, &wifi_ap_config);
    esp_wifi_start();

    ESP_LOGI(TAG, "✅ Wi-Fi AP started. SSID: %s, Password: %s", wifi_ap_config.ap.ssid, wifi_ap_config.ap.password);
    ESP_LOGI(TAG, "📡 Static IP: 192.168.4.1");

    // Initialize mDNS with hostname
    esp_err_t ret = mdns_init();
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "❌ mDNS initialization failed: %d", ret);
        return;
    }

    mdns_hostname_set("digitaldash");
    mdns_instance_name_set("ESP32 Web Server");

    ESP_LOGI(TAG, "🌍 mDNS initialized with hostname: digitaldash.local");
}
