import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useLiveShipEngine } from "../../../../pages/Home/components/ShipLayer/context/LiveShipContext";

/**
 * Automatically detects the user's active viewport on map pan/zoom,
 * and pushes the bounding box to LiveShipContext to immediately request
 * and populate all ships in that location from the backend cache and stream.
 */
export default function MapViewportShipSynchronizer() {
  const { current: mapRef } = useMap();
  const { setViewportBounds } = useLiveShipEngine();
  const lastBoundsStrRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const syncBounds = () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) return;

        const lamin = Math.max(-90, bounds.getSouth());
        const lomin = Math.max(-180, bounds.getWest());
        const lamax = Math.min(90, bounds.getNorth());
        const lomax = Math.min(180, bounds.getEast());

        const boundsKey = `${lamin.toFixed(3)},${lomin.toFixed(3)},${lamax.toFixed(3)},${lomax.toFixed(3)}`;
        if (boundsKey === lastBoundsStrRef.current) return;
        lastBoundsStrRef.current = boundsKey;

        setViewportBounds({ lamin, lomin, lamax, lomax });
      } catch {
        // Ignore errors during map initialization
      }
    };

    // Initial sync
    if (map.isStyleLoaded()) {
      syncBounds();
    } else {
      map.once("load", syncBounds);
      map.once("idle", syncBounds);
    }

    // Sync when user finishes panning or zooming
    map.on("moveend", syncBounds);

    return () => {
      map.off("moveend", syncBounds);
    };
  }, [mapRef, setViewportBounds]);

  return null;
}
