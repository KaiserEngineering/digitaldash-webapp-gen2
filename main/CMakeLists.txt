message(${CMAKE_SOURCE_DIR})

# Register ESP-IDF components
idf_component_register(SRCS "png_transfer.c" "KE_DigitalDash_Webapp_main.c" "spiffs_init.c" "stm32_uart.c"
    INCLUDE_DIRS ".")

# Create static and themes directories
file(MAKE_DIRECTORY "${CMAKE_SOURCE_DIR}/components/web_server/static")
file(MAKE_DIRECTORY "${CMAKE_SOURCE_DIR}/components/web_server/themes")

# Copy scripts/settings.json to frontend/src/settings.json (if frontend exists)
#if(EXISTS "${CMAKE_SOURCE_DIR}/front/src/lib/")
#    file(COPY ${CMAKE_SOURCE_DIR}/scripts/settings.json DESTINATION ${CMAKE_SOURCE_DIR}/front/src/lib/)
#    message(STATUS "Copied settings.json to frontend/src/settings.json")
#endif()

# Copy frontend build files if they exist
#if(EXISTS "${CMAKE_SOURCE_DIR}/front/build/index.html")
#    file(COPY ${CMAKE_SOURCE_DIR}/front/build/index.html DESTINATION ${CMAKE_SOURCE_DIR}/components/web_server/static/)
#    message(STATUS "Copied index.html from frontend build")
#else()
#    message(WARNING "Frontend build not found - using existing static files only")
#endif()

# Copy essential static assets from front/static to components/web_server/static (if front/static exists)
if(EXISTS "${CMAKE_SOURCE_DIR}/front/build")
    # Define essential files to copy (PWA and core assets only)
    set(ESSENTIAL_STATIC_FILES
        "manifest.json"
        "site.webmanifest"
        "sw.js"
        "favicon.ico"
        "favicon.png"
        "pwa-64x64.png"
        "pwa-192x192.png"
        "pwa-512x512.png"
        "maskable-icon-512x512.png"
        "apple-touch-icon-180x180.png"
    )

    foreach(STATIC_FILE ${ESSENTIAL_STATIC_FILES})
        if(EXISTS "${CMAKE_SOURCE_DIR}/front/static/${STATIC_FILE}")
            file(COPY "${CMAKE_SOURCE_DIR}/front/static/${STATIC_FILE}" DESTINATION "${CMAKE_SOURCE_DIR}/components/web_server/static/")
            message(STATUS "Copied essential static file: ${STATIC_FILE}")
        endif()
    endforeach()
else()
    message(WARNING "Frontend static directory not found - using existing static files only")
endif()

set(WEB_SRC_DIR "${CMAKE_SOURCE_DIR}/spiffs")
# Create SPIFFS partition image
if(EXISTS ${WEB_SRC_DIR})
    spiffs_create_partition_image(storage ${WEB_SRC_DIR} FLASH_IN_PROJECT)
else()
    message(FATAL_ERROR "${WEB_SRC_DIR} doesn't exist. Please ensure the frontend is built correctly.")
endif()
