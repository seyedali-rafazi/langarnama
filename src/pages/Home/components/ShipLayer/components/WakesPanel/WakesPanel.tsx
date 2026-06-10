import { Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { BASE_SHIPS } from "../../data/shipFleet";
import { SHIP_TYPE_CONFIG } from "../../types/Ship";
import { useShips } from "../../context/ShipContext";

export default function WakesPanel() {
  const { wakes, toggleWakeVisibility, removeWake } = useShips();
  const data = BASE_SHIPS;

  const wakeItems = useMemo(
    () =>
      wakes.map((wake) => {
        const ship = data.find((s) => s.id === wake.shipId);
        return { wake, ship };
      }),
    [wakes, data]
  );

  if (wakes.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No voyage wakes drawn yet.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Click a ship on the map and press Draw Wake.
        </Typography>
      </Box>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {wakeItems.map(({ wake, ship }) => (
        <ListItem
          key={wake.shipId}
          disablePadding
          sx={{
            mb: 1,
            borderRadius: 2,
            bgcolor: "grey.A100",
            border: "1px solid",
            borderColor: wake.visible ? "primary.main" : "divider",
            opacity: wake.visible ? 1 : 0.6,
            transition: "all 0.2s ease",
          }}
          secondaryAction={
            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton
                edge="end"
                size="small"
                onClick={() => toggleWakeVisibility(wake.shipId)}
                sx={{ color: wake.visible ? "primary.main" : "text.secondary" }}
                title={wake.visible ? "Hide wake" : "Show wake"}
              >
                {wake.visible ? (
                  <Visibility fontSize="small" />
                ) : (
                  <VisibilityOff fontSize="small" />
                )}
              </IconButton>
              <IconButton
                edge="end"
                size="small"
                onClick={() => removeWake(wake.shipId)}
                sx={{ color: "error.main" }}
                title="Remove wake"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <ListItemText
            sx={{ px: 1.5, py: 1, pr: 7 }}
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: ship
                      ? SHIP_TYPE_CONFIG[ship.shipType].color
                      : "text.secondary",
                  }}
                />
                <Typography variant="body2" fontWeight={700} noWrap>
                  {ship?.name ?? wake.shipId}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {ship
                  ? `${ship.origin_port} → ${ship.destination_port}`
                  : "Unknown voyage"}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
