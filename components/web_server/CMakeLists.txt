idf_component_register(SRCS "src/web_server.c" "src/wifi_ap.c" "src/web_settings.c" "src/ota_handler.c" "src/user_images.c" "src/config_handler.c"
    INCLUDE_DIRS "include" "../../main"
    PRIV_REQUIRES esp_http_server esp_wifi nvs_flash mdns app_update spiffs
    EMBED_FILES
    "index.html"
    "factoryImages/bar_aurora.png"
    "factoryImages/flare.png"
    "factoryImages/stock_rs.png"
    "factoryImages/favicon.png"
    "factoryImages/galaxy.png"
    "factoryImages/stock_st.png"
)
