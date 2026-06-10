import { IconLayer } from "@deck.gl/layers";
import type { Port } from "../types/Port";

interface CreatePortLayerOptions {
  onPortClick?: (port: Port) => void;
  onPortHover?: (port: Port | null) => void;
  pickable?: boolean;
}

export function createPortLayer(
  data: Port[],
  options: CreatePortLayerOptions = {}
) {
  const { onPortClick, onPortHover, pickable = true } = options;

  // Anchor inside a harbor ring
  const portSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="42" fill="#0c2d3e" stroke="#22d3ee" stroke-width="3"/>
    <circle cx="50" cy="28" r="7" fill="none" stroke="#a5f3fc" stroke-width="5"/>
    <line x1="50" y1="35" x2="50" y2="74" stroke="#a5f3fc" stroke-width="6" stroke-linecap="round"/>
    <line x1="36" y1="46" x2="64" y2="46" stroke="#a5f3fc" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 62 Q28 80 50 78 Q72 80 72 62" fill="none" stroke="#a5f3fc" stroke-width="5" stroke-linecap="round"/>
  </svg>`;

  const iconUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(portSVG.trim());

  return new IconLayer({
    id: "port-icon-layer",
    data,
    pickable,
    iconAtlas: iconUrl,
    iconMapping: {
      port: { x: 0, y: 0, width: 100, height: 100, anchorX: 50, anchorY: 50 },
    },
    getIcon: () => "port",
    getPosition: (d) => [d.lon, d.lat, 0],
    sizeUnits: "pixels",
    getSize: 28,
    billboard: true,
    autoHighlight: true,
    highlightColor: [34, 211, 238, 180],
    onHover: (info) => {
      if (onPortHover) {
        onPortHover((info.object as Port) ?? null);
      }
    },
    onClick: (info, event) => {
      if (info.object && onPortClick) {
        onPortClick(info.object as Port);
      }
      if (event?.srcEvent) {
        event.srcEvent.stopPropagation();
      }
      return true;
    },
  });
}
