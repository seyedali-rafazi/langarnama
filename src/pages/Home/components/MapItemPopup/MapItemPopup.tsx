import {
  Anchor,
  Close,
  Delete,
  DirectionsBoat,
  Explore,
  Sensors,
  Speed,
  Straighten,
  Timeline,
  Waves,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import { useShips } from "../ShipLayer/context/ShipContext";
import { useLiveShipEngine } from "../ShipLayer/context/LiveShipContext";
import ShipThumb from "../ShipLayer/components/ShipThumb";
import { formatHeading } from "../ShipLayer/utils/shipMovement";
import { SHIP_TYPE_CONFIG, type Ship } from "../ShipLayer/types/Ship";
import type { Port } from "../PortLayer/types/Port";
import type { CoastalStation } from "../StationLayer/types/CoastalStation";
import { useMapLayers } from "../../context/MapLayersContext";
import { usePopupScreenPosition } from "../ShipLayer/hooks/usePopupScreenPosition";
import { POPUP_WIDTH } from "../ShipLayer/utils/getPopupScreenPosition";

const popupMuted = "rgba(255,255,255,0.55)";
const popupText = "rgba(255,255,255,0.92)";

function formatEta(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
      <Typography variant="caption" sx={{ color: popupMuted }}>
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={600} sx={{ color: popupText }}>
        {value}
      </Typography>
    </Box>
  );
}

function ShipPopupContent({
  ship,
  onClose,
}: {
  ship: Ship;
  onClose: () => void;
}) {
  const { addWake, removeWake, hasWake } = useShips();
  const { getVoyage } = useLiveShipEngine();
  const wakeExists = hasWake(ship.id);
  const typeConfig = SHIP_TYPE_CONFIG[ship.shipType];
  const voyage = getVoyage(ship.id);

  return (
    <>
      <Box sx={{ position: "relative", height: 90 }}>
        <ShipThumb shipType={ship.shipType} iconSize={110} />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(29,31,32,0.9) 0%, transparent 70%)",
          }}
        />
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            bgcolor: "rgba(0,0,0,0.5)",
            color: "#fff",
            p: 0.5,
          }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{ position: "absolute", bottom: 8, left: 10 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <DirectionsBoat sx={{ color: typeConfig.color, fontSize: 16 }} />
            <Typography variant="subtitle2" fontWeight={700} color="#fff">
              {ship.name}
            </Typography>
            <Chip
              label={typeConfig.shortLabel}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                bgcolor: typeConfig.color,
                color: "#0b1117",
                fontWeight: 700,
              }}
            />
          </Stack>
          <Typography variant="caption" color="rgba(255,255,255,0.75)">
            {ship.operator} · MMSI {ship.mmsi}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Stack direction="row" spacing={1} mb={1}>
          <Box sx={{ flex: 1, p: 0.75, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", textAlign: "center" }}>
            <Speed sx={{ color: typeConfig.color, fontSize: 14 }} />
            <Typography variant="caption" display="block" fontSize="0.6rem" sx={{ color: popupMuted }}>Speed</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: popupText }}>{ship.speed_kts} kn</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 0.75, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", textAlign: "center" }}>
            <Explore sx={{ color: typeConfig.color, fontSize: 14 }} />
            <Typography variant="caption" display="block" fontSize="0.6rem" sx={{ color: popupMuted }}>Hdg</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: popupText }}>{formatHeading(ship.heading_deg)}°</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 0.75, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", textAlign: "center" }}>
            <Waves sx={{ color: typeConfig.color, fontSize: 14 }} />
            <Typography variant="caption" display="block" fontSize="0.6rem" sx={{ color: popupMuted }}>Draft</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: popupText }}>{ship.draft_m} m</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 0.75, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", textAlign: "center" }}>
            <Straighten sx={{ color: typeConfig.color, fontSize: 14 }} />
            <Typography variant="caption" display="block" fontSize="0.6rem" sx={{ color: popupMuted }}>LOA</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: popupText }}>{ship.length_m} m</Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 0.75 }} />
        <InfoRow label="From" value={ship.origin_port} />
        <InfoRow label="To" value={ship.destination_port} />
        {voyage && (
          <>
            <InfoRow
              label="Distance to go"
              value={`${voyage.remainingNm.toFixed(0)} NM`}
            />
            <InfoRow label="ETA" value={formatEta(voyage.etaMinutes)} />
          </>
        )}
        <InfoRow label="Position" value={`${ship.lat.toFixed(3)}°, ${ship.lon.toFixed(3)}°`} />
        <Button
          fullWidth
          size="small"
          variant={wakeExists ? "outlined" : "contained"}
          color={wakeExists ? "error" : "primary"}
          startIcon={wakeExists ? <Delete /> : <Timeline />}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (wakeExists) {
              removeWake(ship.id);
            } else {
              addWake(ship.id);
            }
          }}
          sx={{ mt: 1.25, py: 0.75, fontWeight: 600 }}
        >
          {wakeExists ? "Delete Wake" : "Draw Wake"}
        </Button>
      </Box>
    </>
  );
}

function PortPopupContent({
  port,
  onClose,
}: {
  port: Port;
  onClose: () => void;
}) {
  return (
    <>
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          bgcolor: "rgba(34,211,238,0.12)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Anchor sx={{ color: "primary.main", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {port.name}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {port.city}, {port.country}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ px: 1.5, py: 1.25 }}>
        <InfoRow label="UN/LOCODE" value={port.locode} />
        <InfoRow label="Berths" value={port.berths} />
        <InfoRow label="Max draft" value={`${port.maxDraft_m} m`} />
        <InfoRow label="Position" value={`${port.lat.toFixed(3)}°, ${port.lon.toFixed(3)}°`} />
      </Box>
    </>
  );
}

function StationPopupContent({
  station,
  onClose,
}: {
  station: CoastalStation;
  onClose: () => void;
}) {
  return (
    <>
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          bgcolor: "rgba(124,58,237,0.15)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Sensors sx={{ color: "#a78bfa", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {station.name}
              </Typography>
            </Stack>
            <Chip
              label={station.type}
              size="small"
              sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#7c3aed", color: "#fff" }}
            />
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ px: 1.5, py: 1.25 }}>
        <InfoRow label="Signal" value={station.frequency} />
        <InfoRow label="Range" value={`${station.range_nm} NM`} />
        <InfoRow label="Operator" value={station.operator} />
        <InfoRow label="Status" value={station.status} />
        <InfoRow label="Position" value={`${station.lat.toFixed(3)}°, ${station.lon.toFixed(3)}°`} />
      </Box>
    </>
  );
}

export default function MapItemPopup() {
  const { current: mapRef } = useMap();
  const { selectedEntity, selectEntity, getEntityData } = useMapLayers();
  const { getShipById } = useLiveShipEngine();
  const skipCloseRef = useRef(false);
  const [frozen, setFrozen] = useState<{
    anchor: { lon: number; lat: number };
    entity: Ship | Port | CoastalStation;
  } | null>(null);

  useEffect(() => {
    if (!selectedEntity) {
      setFrozen(null);
      return;
    }

    if (selectedEntity.category === "ships") {
      const live = getShipById(selectedEntity.id);
      const fallback = getEntityData("ships", selectedEntity.id);
      const ship = live ?? fallback;
      if (ship) {
        setFrozen({
          anchor: { lon: ship.lon, lat: ship.lat },
          entity: { ...ship },
        });
      }
      return;
    }

    const entity = getEntityData(selectedEntity.category, selectedEntity.id);
    if (entity && "lat" in entity && "lon" in entity) {
      setFrozen({
        anchor: { lon: entity.lon, lat: entity.lat },
        entity,
      });
    }
  }, [selectedEntity?.id, selectedEntity?.category, getShipById, getEntityData]);

  const position = usePopupScreenPosition(frozen?.anchor ?? null);

  useEffect(() => {
    if (!selectedEntity) return;

    skipCloseRef.current = true;
    const timer = window.setTimeout(() => {
      skipCloseRef.current = false;
    }, 150);

    const map = mapRef?.getMap();
    if (!map || (map as { _removed?: boolean })._removed) {
      return () => window.clearTimeout(timer);
    }

    const handleMapClick = () => {
      if (skipCloseRef.current) return;
      selectEntity(selectedEntity.category, null);
    };

    map.on("click", handleMapClick);
    return () => {
      window.clearTimeout(timer);
      if (!(map as { _removed?: boolean })._removed) {
        map.off("click", handleMapClick);
      }
    };
  }, [selectedEntity, mapRef, selectEntity]);

  if (!selectedEntity || !frozen || !position) return null;

  const handleClose = () => selectEntity(selectedEntity.category, null);
  const displayEntity = frozen.entity;

  return (
    <Box
      sx={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width: POPUP_WIDTH,
        zIndex: 10,
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        sx={{
          bgcolor: "#1d1f20",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        {selectedEntity.category === "ships" && (
          <ShipPopupContent ship={displayEntity as Ship} onClose={handleClose} />
        )}
        {selectedEntity.category === "ports" && (
          <PortPopupContent port={displayEntity as Port} onClose={handleClose} />
        )}
        {selectedEntity.category === "stations" && (
          <StationPopupContent station={displayEntity as CoastalStation} onClose={handleClose} />
        )}
      </Box>
    </Box>
  );
}
