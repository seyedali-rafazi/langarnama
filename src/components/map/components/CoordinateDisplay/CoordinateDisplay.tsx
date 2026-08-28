import { ContentCopy } from "@mui/icons-material";
import { Box, IconButton, Paper } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useMap, Popup } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "maplibre-gl";
import LatCoordinate from "./components/LatCoordinate";
import LonCoordinate from "./components/LonCoordinate";
import { toast } from "sonner";

const CoordinateDisplay = () => {
  const { current: map } = useMap();
  const [coords, setCoords] = useState<{ lng: string; lat: string; rawLng: number; rawLat: number } | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  // Handle Mouse Movement with rAF throttling
  useEffect(() => {
    if (!map) return;

    let rafId: number | null = null;
    let lastTime = 0;
    let pendingLngLat: { lng: number; lat: number } | null = null;

    const flush = () => {
      rafId = null;
      if (!pendingLngLat) return;
      const { lng, lat } = pendingLngLat;
      setCoords({
        lng: lng.toFixed(5),
        lat: lat.toFixed(5),
        rawLng: lng,
        rawLat: lat,
      });
    };

    const handleMouseMove = (e: any) => {
      pendingLngLat = e.lngLat;
      const now = performance.now();
      // Throttle to at most once every 60ms (approx 16fps)
      if (now - lastTime >= 60) {
        lastTime = now;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(flush);
      } else if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          lastTime = performance.now();
          flush();
        });
      }
    };

    const handleMouseOut = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingLngLat = null;
      setCoords(null);
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
    };
  }, [map]);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      navigator.clipboard.writeText(text).then(() => {
        toast.success("Copied successful into your clipboard");
      });

      setIsPicking(false);
      e.target.getCanvas().style.cursor = "";
    },
    [setIsPicking]
  );

  useEffect(() => {
    if (!map) return;

    if (isPicking) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleMapClick as any);
    } else {
      map.getCanvas().style.cursor = "";
      map.off("click", handleMapClick as any);
    }

    return () => {
      map.off("click", handleMapClick as any);
    };
  }, [isPicking, map, handleMapClick]);

  return (
    <>
      {isPicking && coords && (
        <Popup
          longitude={Number(coords.rawLng)}
          latitude={Number(coords.rawLat)}
          closeButton={false}
          closeOnClick={false}
          anchor="top-left"
          offset={15} // Distance from the cursor
          maxWidth="200px"
          style={{ pointerEvents: "none" }} // Crucial so click goes to map
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#333",
              whiteSpace: "nowrap",
            }}
          >
            Click on map to copy
          </div>
        </Popup>
      )}

      <Paper
        elevation={4}
        sx={{
          borderRadius: "16px",
          backdropFilter: "blur(12px)",
          backgroundColor: "background.paper",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
          padding: "0px 8px",
          width: "320px",
          transition: "all 0.3s ease-in-out",
          overflow: "hidden",
          position: "relative", // Ensure it stays on top
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <LatCoordinate coords={coords} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => setIsPicking(!isPicking)}
              sx={{
                color: isPicking ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: "#8b8b8b8d !important",
                },
              }}
            >
              <ContentCopy
                sx={{
                  fontSize: "12px",
                }}
              />
            </IconButton>
          </Box>

          <LonCoordinate coords={coords} />
        </Box>
      </Paper>
    </>
  );
};

export default CoordinateDisplay;
