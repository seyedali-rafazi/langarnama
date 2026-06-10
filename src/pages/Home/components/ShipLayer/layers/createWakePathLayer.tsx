import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { SHIP_TYPE_CONFIG, type Ship } from "../types/Ship";
import { buildWakePath } from "../utils/shipMovement";

type WakePoint = [number, number];

/** Voyage wake: route sailed so far, tinted with the vessel type color. */
export function createWakePathLayer(ship: Ship, wakePath?: WakePoint[]) {
  const pathCoords = wakePath ?? buildWakePath(ship);
  if (pathCoords.length < 2) return null;

  const startPoint = pathCoords[0];
  const endPoint = pathCoords[pathCoords.length - 1];
  const typeColor = SHIP_TYPE_CONFIG[ship.shipType]?.colorRgb ?? [34, 211, 238];

  const pathLayer = new PathLayer({
    id: `wake-path-${ship.id}`,
    data: [{ path: pathCoords }],
    pickable: false,
    widthUnits: "pixels",
    getPath: (d) => d.path,
    getColor: [...typeColor, 200] as [number, number, number, number],
    getWidth: 4,
    capRounded: true,
    jointRounded: true,
    updateTriggers: {
      getPath: pathCoords,
    },
  });

  const endpointsLayer = new ScatterplotLayer({
    id: `wake-path-endpoints-${ship.id}`,
    data: [
      { position: startPoint, type: "start" },
      { position: endPoint, type: "end" },
    ],
    pickable: false,
    getPosition: (d) => d.position,
    getFillColor: (d) =>
      d.type === "start"
        ? [255, 255, 255, 220]
        : ([...typeColor, 255] as [number, number, number, number]),
    getRadius: 6,
    radiusUnits: "pixels",
    stroked: true,
    getLineColor: [10, 15, 20, 220],
    lineWidthUnits: "pixels",
    getLineWidth: 2,
  });

  return [pathLayer, endpointsLayer];
}
