idf_component_register(SRCS
    "src/web_server.c"
    "src/wifi_ap.c"
    "src/web_settings.c"
    "src/ota_handler.c"
    "src/images_handler.c"
    "src/config_handler.c"
    "src/pids_handler.c"
    "src/file_handler.c"
    "src/upload_utils.c"
    INCLUDE_DIRS "include" "../../main"
    PRIV_REQUIRES esp_http_server esp_wifi nvs_flash mdns app_update spiffs lib_ke_protocol stm_flash stm_gpio
    EMBED_FILES
    "static/index.html.gz"
    "static/favicon.png"
    "static/favicon.ico"
    "themes/Linear.png"
    "themes/Radial.png"
    "themes/Stock RS.png"
    "themes/Stock ST.png"
    "themes/Grumpy Cat.png"
    "themes/Digital.png"
    "themes/Arc.png"
)
