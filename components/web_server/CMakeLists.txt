idf_component_register(SRCS "src/web_server.c" "src/wifi_ap.c" "src/web_settings.c" "src/ota_handler.c" "src/backgrounds.c"
    INCLUDE_DIRS "include" "../../main"
    PRIV_REQUIRES esp_http_server esp_wifi nvs_flash mdns app_update spiffs
    EMBED_FILES
    "index.html.gz"
    "factoryImages/bar_aurora.png.gz"
    "factoryImages/flare.png.gz"
    "factoryImages/stock_rs.png.gz"
    "factoryImages/favicon.png.gz"
    "factoryImages/galaxy.png.gz"
    "factoryImages/stock_st.png.gz"
)
