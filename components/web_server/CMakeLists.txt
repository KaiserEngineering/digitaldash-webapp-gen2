idf_component_register(SRCS
    "src/web_server.c"
    "src/wifi_ap.c"
    "src/web_settings.c"
    "src/ota_handler.c"
    "src/images_handler.c"
    "src/config_handler.c"
    "src/pids_handler.c"
    INCLUDE_DIRS "include" "../../main"
    PRIV_REQUIRES esp_http_server esp_wifi nvs_flash mdns app_update spiffs lib_ke_protocol stm_flash
    EMBED_FILES
    "index.html"
    "factoryImages/Linear.png"
    "factoryImages/Stock RS.png"
    "factoryImages/Stock ST.png"
    "factoryImages/favicon.png"
)

set(VERSION_JSON_PATH "${CMAKE_SOURCE_DIR}/front/build/_app/version.json")

if(EXISTS "${VERSION_JSON_PATH}")
    file(READ "${VERSION_JSON_PATH}" VERSION_JSON_CONTENT)
    message(STATUS "Raw JSON content: '${VERSION_JSON_CONTENT}'")

    # Find the position of "version":"
    string(FIND "${VERSION_JSON_CONTENT}" "\"version\":\"" VERSION_START)
    if(VERSION_START GREATER_EQUAL 0)
        # Move past the "version":" part (11 characters)
        math(EXPR VERSION_VALUE_START "${VERSION_START} + 11")

        # Get substring starting from the version value to find the closing quote
        string(SUBSTRING "${VERSION_JSON_CONTENT}" ${VERSION_VALUE_START} -1 REMAINING_STRING)
        string(FIND "${REMAINING_STRING}" "\"" VERSION_END_RELATIVE)

        message(STATUS "Version start: ${VERSION_START}")
        message(STATUS "Version value start: ${VERSION_VALUE_START}")
        message(STATUS "Version end relative: ${VERSION_END_RELATIVE}")

        if(VERSION_END_RELATIVE GREATER_EQUAL 0)
            # Extract the version number
            string(SUBSTRING "${REMAINING_STRING}" 0 ${VERSION_END_RELATIVE} APP_VERSION)
            message(STATUS "Extracted version: '${APP_VERSION}'")
        else()
            set(APP_VERSION "end-quote-error")
        endif()
    else()
        set(APP_VERSION "no-version-key")
    endif()
else()
    set(APP_VERSION "file-not-found")
endif()

configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/include/version.h.in"
    "${CMAKE_CURRENT_SOURCE_DIR}/include/version.h"
)
