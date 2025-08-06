# DigitalDash ESP32-S3 Web Interface

> **Transform your vehicle's data into a stunning digital dashboard experience**

A cutting-edge web application built with **SvelteKit 5** that provides an intuitive interface for configuring and monitoring Kaiser Engineering's Digital Dashboard system. Create custom gauge layouts, set up intelligent alerts, and personalize your automotive display - all through a sleek, responsive web interface.

## Features

### **Dashboard Customization**
- **Custom Gauge Layouts**: Design multiple dashboard views with drag-and-drop gauge positioning
- **Real-time Data Visualization**: Display live vehicle telemetry with smooth animations
- **Theme System**: Choose from multiple pre-built themes or upload custom backgrounds
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### **Intelligent Monitoring**
- **Smart Alerts**: Configure threshold-based warnings for critical engine parameters
- **Dynamic Rules**: Set up conditional logic for automated responses
- **PID Data Integration**: Direct access to your vehicle's diagnostic data streams

### **Visual Customization**
- **Custom Backgrounds**: Upload and crop your own dashboard backgrounds
- **Theme Gallery**: Pre-loaded themes including Digital, Linear, Radial, and Stock variants
- **Dark/Light Mode**: Automatic theme switching based on user preference

### **System Management**
- **Firmware Updates**: Over-the-air updates for both web interface and STM32 hardware
- **Configuration Backup**: Export/import your dashboard configurations
- **Recovery Mode**: Built-in recovery system for troubleshooting

## Getting Started

### Prerequisites
- Node.js 18+ 
- Yarn or npm package manager
- ESP32-S3 with Kaiser Engineering Digital Dashboard firmware

### Installation

```bash
# Clone the repository
git clone https://github.com/KaiserEngineering/DigitalDash-ESP32-S3-Webapp.git
cd DigitalDash-ESP32-S3-Webapp/front

# Install dependencies
yarn install

# Start development server
yarn dev
```

Visit `http://localhost:5173` to access the web interface.

### Production Build

```bash
# Build for production
yarn build

# Preview production build
yarn preview
```

## Architecture

This project combines modern web technologies with embedded systems:

- **Frontend**: SvelteKit 5 with TypeScript
- **Styling**: TailwindCSS with custom component library
- **State Management**: Svelte stores with reactive data binding
- **Hardware Interface**: RESTful API communicating with ESP32-S3
- **Data Storage**: SQLite database for configuration persistence
- **Real-time Updates**: WebSocket connections for live telemetry

## Screenshots & Demo

### Main Dashboard
![Dashboard View](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)
*Real-time gauge display with customizable layouts*

### Configuration Panel
![Config Panel](https://via.placeholder.com/800x400?text=Configuration+Screenshot)
*Intuitive settings interface for alerts and dynamic rules*

### Theme Customization
![Theme Selection](https://via.placeholder.com/800x400?text=Theme+Screenshot)
*Multiple themes and custom background support*

## Development

### Project Structure
```
src/
├── routes/              # SvelteKit pages and API routes
│   ├── +page.svelte    # Main dashboard
│   ├── alerts/         # Alert configuration
│   ├── dynamic/        # Dynamic rules setup
│   ├── backgrounds/    # Theme management
│   └── api/            # Backend API endpoints
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── stores/         # State management
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript definitions
└── static/             # Static assets
```

### Key Technologies
- **SvelteKit 5**: Modern fullstack framework
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Bits UI**: Accessible component primitives
- **Lucide Icons**: Beautiful icon system
- **Zod**: Runtime type validation
- **Better SQLite3**: Fast, embedded database

### Development Commands

```bash
# Start development server
yarn dev

# Type checking
yarn check

# Linting and formatting
yarn lint
yarn format

# Run tests
yarn test
```

## Hardware Integration

This web interface communicates with:
- **ESP32-S3 microcontroller** running the main dashboard firmware
- **STM32 co-processor** handling real-time data processing
- **CAN bus interface** for vehicle diagnostic data (OBD-II/custom protocols)

### Supported Data Sources
- Engine RPM, temperature, pressure sensors
- Vehicle speed, acceleration, fuel consumption
- Custom analog/digital inputs
- CAN bus diagnostic messages (PIDs)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run the linter and formatter
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [KaiserEngineering.io](https://kaiserengineering.io/)
- **Issues**: [GitHub Issues](https://github.com/KaiserEngineering/DigitalDash-ESP32-S3-Webapp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KaiserEngineering/DigitalDash-ESP32-S3-Webapp/discussions)

## Acknowledgments

- Built with care by [Kaiser Engineering](https://kaiserengineering.io/)
- Powered by the amazing [Svelte](https://svelte.dev/) ecosystem
- Icons by [Lucide](https://lucide.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

---

**Star this repo if you found it helpful!**

![Automotive Dashboard](https://via.placeholder.com/1200x300?text=Kaiser+Engineering+Digital+Dashboard)