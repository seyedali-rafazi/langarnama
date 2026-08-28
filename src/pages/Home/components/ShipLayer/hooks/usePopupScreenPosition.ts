import { useCallback, useLayoutEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
  getPopupScreenPosition,
  POPUP_HEIGHT,
  POPUP_WIDTH,
  type PopupScreenPosition,
} from "../utils/getPopupScreenPosition";

export function usePopupScreenPosition(
  lonLat: { lon: number; lat: number } | null
) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<PopupScreenPosition | null>(null);

  const updatePosition = useCallback(() => {
    const map = mapRef?.getMap();
    if (!map || (map as { _removed?: boolean })._removed || !lonLat) {
      setPosition(null);
      return;
    }
    setPosition(
      getPopupScreenPosition(map, lonLat.lon, lonLat.lat, POPUP_WIDTH, POPUP_HEIGHT)
    );
  }, [mapRef, lonLat]);

  useLayoutEffect(() => {
    if (!lonLat) {
      setPosition(null);
      return;
    }

    let rafId: number | null = null;

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updatePosition();
      });
    };

    updatePosition();

    const map = mapRef?.getMap();
    if (!map || (map as { _removed?: boolean })._removed) return;

    map.on("move", scheduleUpdate);
    map.on("zoom", scheduleUpdate);
    map.on("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if ((map as { _removed?: boolean })._removed) return;
      map.off("move", scheduleUpdate);
      map.off("zoom", scheduleUpdate);
      map.off("resize", scheduleUpdate);
    };
  }, [lonLat, mapRef, updatePosition]);

  return position;
}
