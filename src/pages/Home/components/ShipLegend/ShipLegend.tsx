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
  SHIP_TYPE_CONFIG,
  SHIP_TYPES,
  type ShipType,
} from "../ShipLayer/types/Ship";
import { useMapLayers } from "../../context/MapLayersContext";

/**
 * On-map legend of vessel types. Each row doubles as a filter:
 * clicking toggles that ship type on/off on the map.
 */
export default function ShipLegend() {
  const { shipTypeVisibility, toggleShipType, categoryEnabled } = useMapLayers();
  const [open, setOpen] = useState(true);

  const counts = useMemo(() => {
    const result = Object.fromEntries(SHIP_TYPES.map((t) => [t, 0])) as Record<
      ShipType,
      number
    >;
    for (const ship of BASE_SHIPS) {
      result[ship.shipType] += 1;
    }
    return result;
  }, []);

  if (!categoryEnabled.ships) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "10px",
        bgcolor: "rgba(20,24,27,0.92)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        width: 172,
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
        <Sailing sx={{ fontSize: 15, color: "primary.light" }} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ flex: 1, letterSpacing: 0.4, color: "text.primary" }}
        >
          Vessel Types
        </Typography>
        <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
          {open ? (
            <ExpandLess sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMore sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ px: 0.75, pb: 0.75 }}>
          {SHIP_TYPES.map((type) => {
            const config = SHIP_TYPE_CONFIG[type];
            const visible = shipTypeVisibility[type];
            return (
              <Tooltip
                key={type}
                title={`${config.description} — click to ${visible ? "hide" : "show"}`}
                placement="right"
                arrow
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  onClick={() => toggleShipType(type)}
                  sx={{
                    px: 0.75,
                    py: 0.4,
                    borderRadius: 1,
                    cursor: "pointer",
                    opacity: visible ? 1 : 0.35,
                    transition: "opacity 0.15s ease, background-color 0.15s ease",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "3px",
                      bgcolor: config.color,
                      flexShrink: 0,
                      boxShadow: visible ? `0 0 6px ${config.color}66` : "none",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ flex: 1, color: "text.primary", fontSize: "0.68rem" }}
                    noWrap
                  >
                    {config.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontSize: "0.65rem" }}
                  >
                    {counts[type]}
                  </Typography>
                </Stack>
              </Tooltip>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
