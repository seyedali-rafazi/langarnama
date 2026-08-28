import type { Map as MapLibreMap } from "maplibre-gl";

export const POPUP_WIDTH = 280;
export const POPUP_HEIGHT = 340;
const MARGIN = 12;
const SHIP_GAP = 40;

export interface PopupScreenPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

export function getPopupScreenPosition(
  map: MapLibreMap,
  lon: number,
  lat: number,
  popupWidth = POPUP_WIDTH,
  popupHeight = POPUP_HEIGHT
): PopupScreenPosition {
  const point = map.project([lon, lat]);
  const container = map.getContainer();
  const mapWidth = container.clientWidth;
  const mapHeight = container.clientHeight;

  const spaceAbove = point.y - MARGIN;
  const spaceBelow = mapHeight - point.y - MARGIN;

  const fitsAbove = spaceAbove >= popupHeight + SHIP_GAP;
  const fitsBelow = spaceBelow >= popupHeight + SHIP_GAP;

  let placement: "above" | "below" = "above";
  if (fitsAbove && fitsBelow) {
    placement = spaceAbove >= spaceBelow ? "above" : "below";
  } else if (!fitsAbove && fitsBelow) {
    placement = "below";
  } else if (fitsAbove && !fitsBelow) {
    placement = "above";
  } else {
    placement = spaceBelow > spaceAbove ? "below" : "above";
  }

  let top =
    placement === "above"
      ? point.y - popupHeight - SHIP_GAP
      : point.y + SHIP_GAP;

  top = Math.max(MARGIN, Math.min(top, mapHeight - popupHeight - MARGIN));

  let left = point.x - popupWidth / 2;
  left = Math.max(MARGIN, Math.min(left, mapWidth - popupWidth - MARGIN));

  return { left, top, placement };
}
