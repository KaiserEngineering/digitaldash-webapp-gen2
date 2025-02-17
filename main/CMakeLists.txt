message( ${CMAKE_SOURCE_DIR} )

# Register ESP-IDF components
idf_component_register(SRCS "KE_DigitalDash_Webapp_main.c" "spiffs_init.c" 
    INCLUDE_DIRS ".")

# Check if the frontend build directory exists
if(NOT EXISTS "${CMAKE_SOURCE_DIR}/front/build")
    message(FATAL_ERROR "Frontend build directory does not exist: ${CMAKE_SOURCE_DIR}/front/build. Please run npm install and npm run build in the front/ directory before proceeding.")
else()
    message(STATUS "Frontend build directory exists: ${CMAKE_SOURCE_DIR}/front/build")
endif()

# Clean old index.html.gz data
file(REMOVE ${CMAKE_SOURCE_DIR}/components/web_server/index.html.gz) 
message(STATUS "Cleaned old index.html.gz data")

# Copy scripts/settings.json to frontend/src/settings.json
file(COPY ${CMAKE_SOURCE_DIR}/scripts/settings.json DESTINATION ${CMAKE_SOURCE_DIR}/front/src/lib/)
message(STATUS "Copied settings.json to frontend/src/settings.json")

# Copy frontend build to components
file(COPY ${CMAKE_SOURCE_DIR}/front/build/index.html.gz DESTINATION ${CMAKE_SOURCE_DIR}/components/web_server/)
message(STATUS "Copied frontend build to components")

set(WEB_SRC_DIR "${CMAKE_SOURCE_DIR}/spiffs")
# Create SPIFFS partition image
if(EXISTS ${WEB_SRC_DIR})
    spiffs_create_partition_image(storage ${WEB_SRC_DIR} FLASH_IN_PROJECT)
else()
    message(FATAL_ERROR "${WEB_SRC_DIR} doesn't exist. Please ensure the frontend is built correctly.")
endif()
