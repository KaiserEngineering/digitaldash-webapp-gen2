
## 1.0.5

### Features
- **Web App**: Add view breadcrumb to top navigation
- **Web App**: Add Skeleton loading components for better loading states
- **Web App**: Dynamic page now displays "View 1, 2, 3" instead of "View 0, 1, 2" for better user experience

### Bug Fixes
- **Web App**: Fixed file deletion on Device Info page to update UI without page refresh
- **Web App**: Clear image cache when deleting background images to keep Backgrounds page in sync

### Build & CI
- **GitHub Actions**: Automatically copy built frontend to ESP32 static files during build
- **GitHub Actions**: Extract only latest version from CHANGELOG for release notes
- **Build**: Updated .gitignore to exclude build artifacts and workspace files

## 1.0.4

### Device Information & Storage Management
- **Web App**: Added new "Device Info" page to monitor flash storage usage and manage files
- **Web App**: Real-time SPIFFS storage usage display with color-coded progress bars and warnings
- **Web App**: File management interface to view and delete firmware/config files
- **ESP32**: New `/api/spiffs/info` endpoint provides storage usage statistics (total, used, free, percentage)

### Unified File Upload System
- **ESP32**: Unified SPIFFS upload system - dynamic filename extraction from URL path instead of hardcoded names
- **ESP32**: Single upload handler now supports any filename via `POST /api/spiffs/{filename}`
- **Web App**: Background images now use unified SPIFFS upload system with smart file extension handling
- **Web App**: Consistent delete endpoints across all file types

### Flexible File Filtering
- **ESP32**: Enhanced file listing with filter support - `?filter=bin` for firmware files, `?filter=all` for all files
- **Web App**: Firmware pages show only .bin files while Device Info shows all file types
- **ESP32**: Improved file type detection (Binary, Text, JSON, Configuration, Unknown)

### Bug Fixes
- **Web App**: Fixed Advanced page save functionality to work with current config store architecture
- **Web App**: Added proper success notifications and error handling for configuration saves

## 1.0.3

- **Web App**: Implemented unsaved changes persistence - form edits now persist when navigating between pages
- **Web App**: Simplified save workflow - changes update immediately in preview while only saving to backend on explicit user action

## 1.0.2

- **Web App**: Fixed issue where saved configurations would revert when navigating between pages
- **Web App**: Standardized all data stores to use consistent caching patterns
- **Web App**: Added missing success toast notification for view settings saves
- **Web App**: Make frontend API requests dynamic. This allows for connecting via IP address instead of domain name
- **Web App**: Allow background images to be downloaded

## 0.0.1

- MVP release! 🎉
