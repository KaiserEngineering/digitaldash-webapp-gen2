idf_component_register(SRCS "src/web_server.c" "src/wifi_ap.c" "src/web_settings.c"
    INCLUDE_DIRS "include" "../../main"
    PRIV_REQUIRES esp_http_server esp_wifi nvs_flash mdns app_update
    EMBED_FILES "index.html.gz" "favicon.png"
)
