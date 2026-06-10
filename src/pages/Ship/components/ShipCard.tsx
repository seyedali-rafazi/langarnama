import { East, PushPin, PushPinOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography, alpha } from "@mui/material";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SHIP_TYPE_CONFIG,
  type Ship,
} from "../../Home/components/ShipLayer/types/Ship";
import { useWatchlist } from "../context/WatchlistContext";

const MONO = '"JetBrains Mono", "Cascadia Code", "Roboto Mono", monospace';

interface ShipCardProps {
  ship: Ship;
}

/** Mini compass dial showing the vessel's current heading. */
function HeadingDial({ heading, color }: { heading: number; color: string }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.14)",
        bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <svg viewBox="0 0 52 52" width="52" height="52" style={{ display: "block" }}>
        {/* cardinal ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="26"
            y1="3"
            x2="26"
            y2="7"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            transform={`rotate(${deg} 26 26)`}
          />
        ))}
        {[45, 135, 225, 315].map((deg) => (
          <line
            key={deg}
            x1="26"
            y1="4"
            x2="26"
            y2="6"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            transform={`rotate(${deg} 26 26)`}
          />
        ))}
        {/* heading needle */}
        <g transform={`rotate(${heading} 26 26)`} style={{ transition: "transform 0.4s ease" }}>
          <path d="M26 9 L29.5 26 L26 23 L22.5 26 Z" fill={color} />
        </g>
        <circle cx="26" cy="26" r="2" fill="rgba(255,255,255,0.5)" />
      </svg>
      <Typography
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 7,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: "0.55rem",
          lineHeight: 1,
          color: "rgba(255,255,255,0.65)",
        }}
      >
        {String(Math.round(heading)).padStart(3, "0")}°
      </Typography>
    </Box>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: "0.55rem",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.88)",
          lineHeight: 1.3,
        }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
}

function ShipCard({ ship }: ShipCardProps) {
  const navigate = useNavigate();
  const { isTracked, toggleTracked } = useWatchlist();
  const typeConfig = SHIP_TYPE_CONFIG[ship.shipType];
  const underway = ship.speed_kts >= 0.5;
  const tracked = isTracked(ship.id);

  const handleClick = useCallback(() => {
    navigate(`/ship/${ship.id}`);
  }, [navigate, ship.id]);

  const handleTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTracked(ship.id, ship.name);
    },
    [toggleTracked, ship.id, ship.name]
  );

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: "relative",
        cursor: "pointer",
        height: "100%",
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: "#11171c",
        border: "1px solid rgba(255,255,255,0.07)",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
        backgroundSize: "100% 4px",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
        "&:hover": {
          borderColor: alpha(typeConfig.color, 0.55),
          bgcolor: "#131a20",
          boxShadow: `0 0 0 1px ${alpha(typeConfig.color, 0.25)}, 0 12px 36px rgba(0,0,0,0.5)`,
          "& .card-cta": { color: typeConfig.color, "& svg": { transform: "translateX(3px)" } },
        },
      }}
    >
      {/* type-color spine */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${typeConfig.color}, ${alpha(typeConfig.color, 0.25)})`,
        }}
      />

      <Box sx={{ p: 2, pl: 2.25 }}>
        {/* header: status + name + dial */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: underway ? "#22c55e" : "#facc15",
                  boxShadow: underway ? "0 0 6px rgba(34,197,94,0.9)" : "0 0 6px rgba(250,204,21,0.7)",
                  flexShrink: 0,
                  animation: underway ? "shipcard-pulse 2s ease-in-out infinite" : "none",
                  "@keyframes shipcard-pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.35 },
                  },
                }}
              />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.55rem",
                  letterSpacing: "0.14em",
                  color: underway ? "#22c55e" : "#facc15",
                }}
              >
                {underway ? "UNDERWAY" : "HOLDING"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                · {ship.id}
              </Typography>
            </Stack>

            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
              sx={{ color: "rgba(255,255,255,0.94)", lineHeight: 1.25 }}
            >
              {ship.name}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              display="block"
              sx={{ color: "rgba(255,255,255,0.5)" }}
            >
              {ship.operator}
            </Typography>

            <Box
              sx={{
                display: "inline-block",
                mt: 0.75,
                px: 0.75,
                py: 0.1,
                borderRadius: 0.75,
                border: `1px solid ${alpha(typeConfig.color, 0.5)}`,
                color: typeConfig.color,
                fontFamily: MONO,
                fontSize: "0.58rem",
                letterSpacing: "0.12em",
              }}
            >
              {typeConfig.shortLabel.toUpperCase()}
            </Box>
          </Box>

          <HeadingDial heading={ship.heading_deg} color={typeConfig.color} />
        </Stack>

        {/* telemetry grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            mt: 1.75,
            py: 1,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <DataCell label="SPD" value={`${ship.speed_kts}kn`} />
          <DataCell label="LOA" value={`${ship.length_m}m`} />
          <DataCell label="DFT" value={`${ship.draft_m}m`} />
          <DataCell label="WPT" value={`${ship.path.length}`} />
        </Box>

        {/* route */}
        <Stack direction="row" alignItems="center" spacing={1} mt={1.25} sx={{ minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.82)" }}
            >
              {ship.origin_port}
            </Typography>
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              width: 26,
              borderTop: `1px dashed ${alpha(typeConfig.color, 0.7)}`,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                right: -1,
                top: -3,
                border: "3px solid transparent",
                borderLeftColor: alpha(typeConfig.color, 0.9),
              },
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              textAlign="right"
              sx={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.82)" }}
            >
              {ship.destination_port}
            </Typography>
          </Box>
        </Stack>

        {/* footer */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.25}>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.38)",
            }}
          >
            MMSI {ship.mmsi}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title={tracked ? "Stop tracking" : "Track vessel"}>
              <IconButton
                size="small"
                onClick={handleTrack}
                sx={{
                  width: 26,
                  height: 26,
                  color: tracked ? "#22d3ee" : "rgba(255,255,255,0.35)",
                  "&:hover": { color: "#22d3ee", bgcolor: "rgba(34,211,238,0.1)" },
                }}
              >
                {tracked ? (
                  <PushPin sx={{ fontSize: 15 }} />
                ) : (
                  <PushPinOutlined sx={{ fontSize: 15 }} />
                )}
              </IconButton>
            </Tooltip>
            <Typography
              className="card-cta"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                fontFamily: MONO,
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.45)",
                transition: "color 0.2s ease",
                "& svg": { fontSize: 13, transition: "transform 0.2s ease" },
              }}
            >
              DETAIL <East />
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default memo(ShipCard);
