import { IconLayer } from "@deck.gl/layers";
import type { CoastalStation } from "../types/CoastalStation";

interface CreateStationLayerOptions {
  onStationClick?: (station: CoastalStation) => void;
  onStationHover?: (station: CoastalStation | null) => void;
  pickable?: boolean;
}

export function createStationLayer(
  data: CoastalStation[],
  options: CreateStationLayerOptions = {}
) {
  const { onStationClick, onStationHover, pickable = true } = options;

  // Lighthouse tower with beams
  const stationSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <polygon points="42,38 58,38 64,88 36,88" fill="#a78bfa" stroke="#7c3aed" stroke-width="2"/>
    <rect x="40" y="26" width="20" height="12" rx="2" fill="#fbbf24"/>
    <rect x="38" y="20" width="24" height="6" rx="2" fill="#7c3aed"/>
    <line x1="36" y1="30" x2="14" y2="22" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>
    <line x1="64" y1="30" x2="86" y2="22" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>
    <line x1="40" y1="56" x2="60" y2="56" stroke="#7c3aed" stroke-width="3"/>
    <line x1="38" y1="72" x2="62" y2="72" stroke="#7c3aed" stroke-width="3"/>
  </svg>`;

  const iconUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(stationSVG.trim());

  return new IconLayer({
    id: "station-icon-layer",
    data,
    pickable,
    iconAtlas: iconUrl,
    iconMapping: {
      station: { x: 0, y: 0, width: 100, height: 100, anchorX: 50, anchorY: 50 },
    },
    getIcon: () => "station",
    getPosition: (d) => [d.lon, d.lat, 0],
    sizeUnits: "pixels",
    getSize: 26,
    billboard: true,
    autoHighlight: true,
    highlightColor: [167, 139, 250, 180],
    onHover: (info) => {
      if (onStationHover) {
        onStationHover((info.object as CoastalStation) ?? null);
      }
    },
    onClick: (info, event) => {
      if (info.object && onStationClick) {
        onStationClick(info.object as CoastalStation);
      }
      if (event?.srcEvent) {
        event.srcEvent.stopPropagation();
      }
      return true;
    },
  });
}
