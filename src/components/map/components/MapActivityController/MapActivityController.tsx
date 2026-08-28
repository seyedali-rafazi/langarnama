import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

export default function MapActivityController({ active }: { active: boolean }) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || (map as { _removed?: boolean })._removed) return;

    if (active) {
      const container = map.getContainer?.();
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        try {
          map.resize();
        } catch {
          // Ignore resize errors during initial mount
        }
      }
    } else {
      try {
        map.stop();
      } catch {
        // Ignore stop errors if map is unloading
      }
    }
  }, [active, mapRef]);

  return null;
}
