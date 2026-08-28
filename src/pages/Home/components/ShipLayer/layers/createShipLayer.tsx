import { IconLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import {
  SHIP_TYPE_CONFIG,
  SHIP_TYPES,
  type Ship,
  type ShipType,
} from "../types/Ship";

interface CreateShipLayerOptions {
  onShipClick?: (ship: Ship) => void;
  onShipHover?: (ship: Ship | null) => void;
  iconSize?: number;
  showLabels?: boolean;
  pickable?: boolean;
  /** Bumped on map style change so deck.gl rebuilds the icon atlas cleanly. */
  layerKey?: string;
}

const ICON_CELL = 64;

/** One pre-colored triangle per vessel type in a single atlas (avoids tint bugs). */
function buildShipIconAtlas() {
  const width = ICON_CELL * SHIP_TYPES.length;
  const shapes = SHIP_TYPES.map((type, index) => {
    const color = SHIP_TYPE_CONFIG[type].color;
    const offset = index * ICON_CELL;
    return `<g transform="translate(${offset},0)"><polygon points="32,5 54,57 32,48 10,57" fill="${color}" stroke="#0f1722" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${ICON_CELL}" viewBox="0 0 ${width} ${ICON_CELL}">${shapes}</svg>`;
}

const SHIP_ICON_ATLAS =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(buildShipIconAtlas());

const SHIP_ICON_MAPPING: Record<
  ShipType,
  { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }
> = Object.fromEntries(
  SHIP_TYPES.map((type, index) => [
    type,
    {
      x: index * ICON_CELL,
      y: 0,
      width: ICON_CELL,
      height: ICON_CELL,
      anchorX: ICON_CELL / 2,
      anchorY: 40,
    },
  ])
) as Record<
  ShipType,
  { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }
>;

export function createShipIconLayer(
  data: Ship[],
  options: CreateShipLayerOptions = {}
) {
  const {
    onShipClick,
    onShipHover,
    iconSize = 20,
    showLabels = false,
    pickable = true,
    layerKey = "default",
  } = options;

  const layers: Layer[] = [
    new IconLayer({
      id: `ship-icon-layer-${layerKey}`,
      data,
      pickable,
      iconAtlas: SHIP_ICON_ATLAS,
      iconMapping: SHIP_ICON_MAPPING,
      getIcon: (d: Ship) => d.shipType,
      getPosition: (d: Ship) => [d.lon, d.lat, 0],
      sizeUnits: "pixels",
      getSize: iconSize,
      getAngle: (d: Ship) => -(d.heading_deg || 0),
      billboard: false,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 140],
      updateTriggers: {
        getPosition: [data],
        getAngle: [data],
        getIcon: [data],
      },
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
        id: `ship-label-layer-${layerKey}`,
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
        updateTriggers: {
          getPosition: [data],
          getText: [data],
        },
      })
    );
  }

  return layers;
}
