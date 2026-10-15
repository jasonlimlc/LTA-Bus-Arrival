# SG Bus Arrival & Live Fleet Tracker

A Singapore-based real-time bus arrival timing application that tracks live bus vehicle locations and provides accurate wait time predictions for all LTA (Land Transport Authority) bus stops.

## Features

- **Live LTA DataMall Predictions**: Real-time arrival predictions for the next 3 buses with second-by-second countdowns.
- **Crowd Capacity Indicators**: Color-coded load indicators for Seats Available (`SEA`), Standing Available (`SDA`), and Limited Standing (`LSD`).
- **Fleet Accessibility & Types**: Indicators for Wheelchair Accessible (`WAB`), Single Deck (`SD`), Double Deck (`DD`), and Bendy (`BD`) buses.
- **5-Digit Bus Stop Lookup**: Instant search by LTA 5-digit bus stop code, road name, or landmark with MRT interchange badges (NSL, EWL, CCL, DTL, TEL, NEL).
- **Interactive Singapore Transit Map**: Built with Leaflet and CartoDB vector tiles, displaying real-time animated bus positions, stop pins, and route polylines.
- **Bus Route Sequence Explorer**: Step-by-step route transit line showing sequence of stops, distance in kilometers, and live approaching vehicles.
- **GPS Distance & Simulator**: Geolocation with quick presets for Orchard, Raffles Place, Tampines, and Jurong East.
- **Favorites & Commute Shortcuts**: Star frequent stops and pin daily bus routes.
- **Arrival Alerts**: 1-tap reminders when a bus is 1 minute away.
- **Pluggable Backend Architecture**: Seamless toggle between high-fidelity simulation and custom backend proxies (Node.js/Express snippet included).

## Tech Stack

- **React 19 & TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Leaflet & CartoDB Tiles**
- **Lucide Icons & Motion**

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
