import { DirectionsBoat } from "@mui/icons-material";
import { Paper, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useLiveShipEngine } from "../ShipLayer/context/LiveShipContext";
import { useMapLayers } from "../../context/MapLayersContext";

export default function MapShipBadge() {
  const { current: mapRef } = useMap();
  const { getSnapshot } = useLiveShipEngine();
  const { isShipVisible } = useMapLayers();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const recompute = () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      let visible = 0;
      for (const ship of getSnapshot()) {
        if (isShipVisible(ship) && bounds.contains([ship.lon, ship.lat])) {
          visible += 1;
        }
      }
      setCount(visible);
    };

    recompute();
    // Update on moveend when panning completes and periodically every second
    const interval = window.setInterval(recompute, 1000);
    map.on("moveend", recompute);

    return () => {
      window.clearInterval(interval);
      map.off("moveend", recompute);
    };
  }, [mapRef, getSnapshot, isShipVisible]);

  return (
    <Tooltip title="Ships in current view" placement="left" arrow>
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          minWidth: 36,
          p: 1,
          mb: 1,
          borderRadius: "8px",
          backgroundColor: "background.paper",
          color: "text.secondary",
        }}
      >
        <DirectionsBoat sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {count}
        </Typography>
      </Paper>
    </Tooltip>
  );
}
