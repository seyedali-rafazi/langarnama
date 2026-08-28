import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

/** Keeps the map flat (rectangular mercator) — no globe or 3D tilt. */
export default function MapFlatViewEnforcer() {
  const { current } = useMap();

  useEffect(() => {
    const map = current?.getMap();
    if (!map || (map as { _removed?: boolean })._removed) return;

    const enforceFlatView = () => {
      if ((map as { _removed?: boolean })._removed) return;

      try {
        if (typeof (map as any).setProjection === "function") {
          (map as any).setProjection({ type: "mercator" });
        }
      } catch {
        // Projection API fallback
      }

      try {
        if (map.getPitch() !== 0) {
          map.setPitch(0);
        }
        if (map.getBearing() !== 0) {
          map.setBearing(0);
        }
        if (map.dragRotate?.isEnabled()) {
          map.dragRotate.disable();
        }
        if (map.touchPitch?.isEnabled()) {
          map.touchPitch.disable();
        }
      } catch {
        // Safe guard during initial layout
      }
    };

    if (map.isStyleLoaded()) {
      enforceFlatView();
    }
    map.on("styledata", enforceFlatView);

    return () => {
      map.off("styledata", enforceFlatView);
    };
  }, [current]);

  return null;
}
