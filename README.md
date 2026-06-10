<div align="center">

# Langarnama

**An interactive ship-tracking and maritime map platform**

Real-time-style vessel visualization with color-coded ship types, rich drawing tools, and layered nautical data — built with React, Mapbox GL, and deck.gl.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Mapbox GL](https://img.shields.io/badge/Mapbox%20GL-3-000000?logo=mapbox&logoColor=white)
![deck.gl](https://img.shields.io/badge/deck.gl-9-29323c)
![MUI](https://img.shields.io/badge/MUI-7-007fff?logo=mui&logoColor=white)

</div>

---

## Overview

**live :** [langarnama.ir](https://www.langarnama.ir/)


**Langarnama** ("anchor chronicle") is a dark-themed maritime map application centered on Iranian waters — the Persian Gulf, Strait of Hormuz, Gulf of Oman, and the southern Caspian Sea. It renders a simulated live fleet of ships moving along realistic shipping lanes, alongside ports and coastal stations (VTS, AIS, lighthouses, radar), on top of switchable base maps. A full suite of drawing and measurement tools turns the map into an interactive workspace.

> Ship movement is **simulated client-side** — each vessel advances along predefined waypoints at its service speed using haversine math, animated at ~20 Hz (with a time-scale factor so slow maritime speeds stay visible). No external AIS API is required.

## Ship types & colors

Every vessel is color-coded by type, on the map icon, in the legend, and across all UI:

| Color | Type | Examples |
|-------|------|----------|
| 🔴 Red | **Oil Tanker** | Crude / product tankers out of Kharg & Assaluyeh |
| 🟠 Orange | **Cargo / Container** | IRISL & Caspian cargo lines |
| 🟢 Green | **Fishing Vessel** | Trawlers and dhows near Hormozgan, Bushehr, Chabahar, Caspian |
| 🔵 Blue | **Passenger / Ferry** | Kish, Dubai, and Caspian ferry routes |
| 🟡 Yellow | **Tug / Support** | Harbor tugs at Shahid Rajaee & Bushehr |
| ⚪ Slate | **Naval / Patrol** | Navy and coast guard patrols |

## Features

### Map

- **4 base map styles** — Balad (default, token-free), Mapbox Streets, Dark, and Satellite — switchable live with camera preserved
- **deck.gl overlay** rendering 42 ships (heading-rotated, type-colored icons), 12 ports, and 12 coastal stations (VTS, AIS Base, Lighthouse, Coastal Radar)
- **Vessel type legend** — on-map legend of all six ship types with fleet counts; click a type to filter it on/off
- **Layers panel** — toggle whole categories (Ships / Ports / Stations) or individual items, search, and focus entities on the map
- **Ship popups** — speed, heading, draft, length plus voyage info with **distance-to-go and live ETA**
- **Voyage wakes** — draw a wake for any ship and watch its sailed route render in the vessel's type color
- **Name & speed labels** — optional per-ship labels (toggle in Settings)
- **Viewport ship badge** — live count of visible ships in the current view
- **Coordinate display** — live cursor lat/lon with click-to-copy pick mode
- Flat 2D enforced view, fly-home (Persian Gulf), zoom, compass reset, IP-based locate, box-zoom, and fullscreen controls

### Drawing tools

| Tool | Description |
|------|-------------|
| Marker | Place named markers with custom color, icon shape (star/circle/square), size, and opacity |
| Line | Multi-point polylines with name, color, width, and opacity |
| Free draw | Freehand strokes with adjustable color and width |
| Rectangle | Drag-to-draw, then move/resize |
| Polygon | Click vertices, finish with Enter or double-click |
| Circle | Drag from center with km radius |
| Intersection | Draw multiple lines — intersections between them are auto-detected and marked |

### Extra tools

| Tool | Description |
|------|-------------|
| Go To | Fly to coordinates — Lat/Lon or UTM (zone + hemisphere) |
| Ruler | Multi-segment distance measurement with per-segment and total km labels |
| Image overlay | Drop JPG/PNG images on the map with scale, rotation, and opacity controls |
| Capture area | Drag-select a region of the map and download it as a PNG |

### Fleet pages

- **Fleet overview** (`/ship`) — searchable grid of all vessels, filterable by operator, vessel type, and speed range
- **Ship detail** (`/ship/:id`) — voyage telemetry, vessel particulars (MMSI, LOA, draft), route waypoints, and a *View on Map* shortcut

### Settings

- Base map style selector
- Ship icon size (16–64 px)
- Name & speed label visibility toggle

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 5](https://vitejs.dev/) |
| Map engine | [Mapbox GL JS 3](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl 8](https://visgl.github.io/react-map-gl/) |
| Data visualization | [deck.gl 9](https://deck.gl/) (IconLayer, PathLayer, ScatterplotLayer, TextLayer) |
| UI | [Material UI 7](https://mui.com/) + Emotion |
| State | [Redux Toolkit](https://redux-toolkit.js.org/) + React Context |
| Routing | [React Router 7](https://reactrouter.com/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |

## Getting started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (ships with Node)
- A free **Mapbox access token** *(optional — only needed for the Streets / Dark / Satellite styles; the default Balad style works without one)*

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd ase

# 2. Install dependencies
npm install

# 3. Configure environment (optional)
copy .env.example .env
# then put your token in .env:
# VITE_MAPBOX_TOKEN=pk.your_token_here

# 4. Start the dev server
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over the project |

## Configuration

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MAPBOX_TOKEN` | No | Mapbox access token. Get one at [account.mapbox.com](https://account.mapbox.com/access-tokens/). Without it, only the **Balad** style (served from raah.ir) is available. |

### Data files

All map entities are local JSON — easy to swap or extend:

| File | Contents |
|------|----------|
| `src/pages/Home/components/ShipLayer/data/iran_ships.json` | 42 ships with name, MMSI, operator, type, speed, draft, length, and waypoint routes |
| `src/pages/Home/components/PortLayer/data/iran_ports.json` | 12 ports (UN/LOCODE, city, berths, max draft) |
| `src/pages/Home/components/StationLayer/data/iran_coastal_stations.json` | 12 coastal stations (VTS, AIS, lighthouse, radar) |

## Project structure

```
ase/
├── public/                  # Static assets (favicon, icons)
├── src/
│   ├── App.tsx              # Theme, routes, providers, sidebar config
│   ├── main.tsx             # Entry point + boot loader handoff
│   ├── components/
│   │   ├── layout/          # AppShell (persistent map across routes)
│   │   ├── map/             # Map core
│   │   │   ├── LangarnamaMap.tsx
│   │   │   ├── components/
│   │   │   │   ├── MapDrawTool/      # Marker, line, polygon, circle, … tools
│   │   │   │   ├── ExtraMapTools/    # Ruler, go-to, capture, image overlay
│   │   │   │   ├── MapNavigator/     # Zoom, compass, locate, fly-home
│   │   │   │   ├── CoordinateDisplay/
│   │   │   │   └── ...
│   │   │   └── context/     # MapToolContext (exclusive tool management)
│   │   └── utils/           # Sidebar, expandable tool boxes
│   ├── pages/
│   │   ├── Home/            # Map page: ship/port/station layers, vessel
│   │   │                    # legend, layers panel, wakes, popups, focus
│   │   ├── Ship/            # Fleet list + ship detail pages
│   │   └── Settings/        # Settings panel (sidebar)
│   ├── store/               # Redux Toolkit (settings slice, map styles)
│   └── hooks/               # Shared hooks
├── .env.example
└── package.json
```

## Routes

| Route | Page |
|-------|------|
| `/` | Interactive map (supports `?select=<shipId>` to focus a ship) |
| `/ship` | Fleet overview list |
| `/ship/:id` | Ship detail page |

## Architecture notes

- **Persistent map** — the map is mounted once in `AppShell` and hidden (with simulation paused) on non-home routes, avoiding the heavy Mapbox/deck.gl teardown-and-rebuild cost when navigating.
- **Exclusive tools** — `MapToolContext` guarantees only one interactive tool (draw, ruler, capture, …) is active at a time.
- **Style switching** — `MapStyleSynchronizer` swaps Mapbox styles in place while preserving the camera, then re-attaches the deck.gl overlay.
- **Simulation loop** — `LiveShipContext` drives a `requestAnimationFrame` loop that advances every ship along its waypoint route at its service speed (time-scaled ×30 so maritime speeds remain visible).

## License

This project is private and not currently licensed for public use.
