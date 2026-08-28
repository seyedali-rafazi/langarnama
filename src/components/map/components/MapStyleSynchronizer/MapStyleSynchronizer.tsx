import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useAppSelector } from "../../../../store/hooks";
import { getMapStyleUrl } from "../../../../store/mapStyles";

/**
 * Applies map style changes from Redux without resetting camera position.
 * The Map component keeps a fixed initial mapStyle prop to avoid double setStyle calls.
 */
export default function MapStyleSynchronizer() {
  const { current } = useMap();
  const mapStyleId = useAppSelector((state) => state.settings.mapStyleId);
  const activeStyleIdRef = useRef(mapStyleId);

  useEffect(() => {
    const map = current?.getMap();
    if (!map || (map as { _removed?: boolean })._removed) return;

    if (mapStyleId === activeStyleIdRef.current) return;

    // Mark the target style as applied immediately.
    activeStyleIdRef.current = mapStyleId;

    const nextStyle = getMapStyleUrl(mapStyleId);
    let camera = {
      center: { lng: 53.5, lat: 29.5 } as any,
      zoom: 5,
      bearing: 0,
      pitch: 0,
    };

    try {
      if (typeof map.getCenter === "function" && typeof map.getZoom === "function") {
        camera = {
          center: map.getCenter(),
          zoom: map.getZoom(),
          bearing: 0,
          pitch: 0,
        };
      }
    } catch {
      // Use fallback camera
    }

    const handleStyleLoad = () => {
      try {
        if (typeof (map as any).setProjection === "function") {
          (map as any).setProjection({ type: "mercator" });
        }
      } catch {
        // Ignore if projection cannot be set on this style.
      }

      try {
        map.jumpTo(camera);
        if (map.dragRotate?.isEnabled()) map.dragRotate.disable();
        if (map.touchPitch?.isEnabled()) map.touchPitch.disable();
      } catch {
        // Safe guard
      }

      // Notify deck.gl overlay to refresh after projection/camera are restored.
      try {
        map.fire("ase:style-ready");
      } catch {
        // Safe guard
      }
    };

    map.once("styledata", handleStyleLoad);

    // Force style apply so sources/layers are re-initialized cleanly.
    try {
      map.setStyle(nextStyle as any, { diff: false });
    } catch {
      // Safe guard
    }

    return () => {
      map.off("styledata", handleStyleLoad);
    };
  }, [current, mapStyleId]);

  return null;
}
