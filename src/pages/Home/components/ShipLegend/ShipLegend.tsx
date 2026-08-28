import { ExpandLess, ExpandMore, Sailing } from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { BASE_SHIPS } from "../ShipLayer/data/shipFleet";
import {
  SHIP_TYPES,
  SHIP_TYPE_CONFIG,
  type ShipType,
} from "../ShipLayer/types/Ship";
import { useMapLayers } from "../../context/MapLayersContext";
import {
  useLiveShipEngine,
  useLiveShipSnapshot,
} from "../ShipLayer/context/LiveShipContext";

export default function ShipLegend() {
  const { shipTypeVisibility, toggleShipType, categoryEnabled } = useMapLayers();
  const { streamState, liveMessageCount, isLiveStream } = useLiveShipEngine();
  const liveShips = useLiveShipSnapshot();
  const [open, setOpen] = useState(true);

  const allShips = liveShips.length > 0 ? liveShips : BASE_SHIPS;

  const counts = useMemo(() => {
    const result = Object.fromEntries(SHIP_TYPES.map((t) => [t, 0])) as Record<
      ShipType,
      number
    >;
    for (const ship of allShips) {
      if (result[ship.shipType] !== undefined) {
        result[ship.shipType] += 1;
      }
    }
    return result;
  }, [allShips]);

  if (!categoryEnabled.ships) return null;

  const isLive = streamState === "connected" || isLiveStream;

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "10px",
        bgcolor: "rgba(20,24,27,0.92)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        width: 178,
        pointerEvents: "auto",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        onClick={() => setOpen((v) => !v)}
        sx={{ px: 1.25, py: 0.75, cursor: "pointer", userSelect: "none" }}
      >
        <Sailing sx={{ fontSize: 15, color: isLive ? "success.light" : "primary.light" }} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ flex: 1, letterSpacing: 0.4, color: "text.primary" }}
        >
          {isLive ? `Live AIS (${allShips.length})` : `Vessels (${allShips.length})`}
        </Typography>
        <Tooltip
          title={
            isLive
              ? `Live AISStream Connected (${liveMessageCount > 0 ? `${liveMessageCount} msgs` : `${allShips.length} real ships`})`
              : streamState === "connecting"
              ? "Connecting to AISStream.io..."
              : "Running Local Simulation / Cache"
          }
          arrow
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: isLive ? "#22c55e" : streamState === "connecting" ? "#facc15" : "#06b6d4",
              boxShadow: isLive
                ? "0 0 6px rgba(34,197,94,0.9)"
                : "0 0 6px rgba(6,182,212,0.9)",
              animation: "legend-pulse 2s infinite ease-in-out",
              "@keyframes legend-pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
            }}
          />
        </Tooltip>
        <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
          {open ? (
            <ExpandLess sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMore sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Stack spacing={0.5} sx={{ px: 1.25, pb: 1 }}>
          {SHIP_TYPES.map((type) => {
            const config = SHIP_TYPE_CONFIG[type];
            const visible = shipTypeVisibility[type] ?? true;
            return (
              <Stack
                key={type}
                direction="row"
                alignItems="center"
                spacing={0.75}
                onClick={() => toggleShipType(type)}
                sx={{
                  cursor: "pointer",
                  opacity: visible ? 1 : 0.4,
                  py: 0.25,
                  px: 0.5,
                  borderRadius: "6px",
                  transition: "opacity 0.15s, background-color 0.15s",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "2px",
                    bgcolor: config.color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    textDecoration: visible ? "none" : "line-through",
                  }}
                >
                  {config.shortLabel}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: visible ? "text.primary" : "text.disabled",
                    bgcolor: "rgba(255,255,255,0.06)",
                    px: 0.6,
                    py: 0.1,
                    borderRadius: "4px",
                  }}
                >
                  {counts[type]}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Collapse>
    </Paper>
  );
}
