import { IconLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import { SHIP_TYPE_CONFIG, SHIP_TYPES, type Ship, type ShipType } from "../types/Ship";

interface CreateShipLayerOptions {
  onShipClick?: (ship: Ship) => void;
  onShipHover?: (ship: Ship | null) => void;
  iconSize?: number;
  showLabels?: boolean;
  pickable?: boolean;
}

/** Top-view hull silhouette, bow pointing north, tinted per vessel type. */
function shipSVG(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feOffset dx="0" dy="2" result="offset-blur"/><feGaussianBlur in="offset-blur" stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#shadow)"><path d="M50 4 C61 18 67 32 67 48 L67 84 Q67 93 58 93 L42 93 Q33 93 33 84 L33 48 C33 32 39 18 50 4 Z" fill="${color}" stroke="#0f1722" stroke-width="3" stroke-linejoin="round"/><path d="M50 12 C56 21 60 30 61 40 L39 40 C40 30 44 21 50 12 Z" fill="rgba(255,255,255,0.35)"/><line x1="50" y1="44" x2="50" y2="58" stroke="rgba(15,23,34,0.4)" stroke-width="2.5" stroke-linecap="round"/><rect x="40" y="62" width="20" height="18" rx="3" fill="rgba(255,255,255,0.85)" stroke="rgba(15,23,34,0.45)" stroke-width="1.5"/><rect x="45" y="67" width="10" height="5" rx="1.5" fill="rgba(15,23,34,0.55)"/></g></svg>`;
}

const TYPE_ICON_URLS: Record<ShipType, string> = Object.fromEntries(
  SHIP_TYPES.map((type) => [
    type,
    "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(shipSVG(SHIP_TYPE_CONFIG[type].color)),
  ])
) as Record<ShipType, string>;

export function createShipIconLayer(
  data: Ship[],
  options: CreateShipLayerOptions = {}
) {
  const {
    onShipClick,
    onShipHover,
    iconSize = 30,
    showLabels = false,
    pickable = true,
  } = options;

  const layers: Layer[] = [
    new IconLayer({
      id: "ship-icon-layer",
      data,
      pickable,
      getIcon: (d: Ship) => ({
        url: TYPE_ICON_URLS[d.shipType] ?? TYPE_ICON_URLS.cargo,
        id: d.shipType,
        width: 100,
        height: 100,
        anchorX: 50,
        anchorY: 50,
      }),
      getPosition: (d: Ship) => [d.lon, d.lat, 0],
      sizeUnits: "pixels",
      getSize: iconSize,
      getAngle: (d: Ship) => -(d.heading_deg || 0),
      billboard: false,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 140],
      onHover: (info) => {
        if (onShipHover) {
          onShipHover((info.object as Ship) ?? null);
        }
      },
      onClick: (info, event) => {
        if (info.object && onShipClick) {
          onShipClick(info.object as Ship);
        }
        if (event?.srcEvent) {
          event.srcEvent.stopPropagation();
        }
        return true;
      },
    }),
  ];

  if (showLabels) {
    layers.push(
      new TextLayer({
        id: "ship-label-layer",
        data,
        pickable: false,
        getPosition: (d: Ship) => [d.lon, d.lat, 0],
        getText: (d: Ship) => `${d.name} · ${d.speed_kts.toFixed(0)} kn`,
        getSize: 12,
        getColor: (d: Ship) => [
          ...(SHIP_TYPE_CONFIG[d.shipType]?.colorRgb ?? [255, 255, 255]),
          240,
        ],
        getPixelOffset: [0, -(iconSize / 2 + 10)],
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600,
        outlineWidth: 2,
        outlineColor: [10, 15, 20, 220],
        billboard: true,
      })
    );
  }

  return layers;
}
