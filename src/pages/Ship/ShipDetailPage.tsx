import {
  Anchor,
  ArrowBack,
  DirectionsBoat,
  Explore,
  LocationOn,
  PushPin,
  PushPinOutlined,
  Schedule,
  Speed,
  Straighten,
  Waves,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Fade,
  Grow,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shipData from "../Home/components/ShipLayer/data/iran_ships.json";
import {
  SHIP_TYPE_CONFIG,
  type Ship,
} from "../Home/components/ShipLayer/types/Ship";
import ShipThumb from "../Home/components/ShipLayer/components/ShipThumb";
import { useWatchlist } from "./context/WatchlistContext";

const allShips = shipData as Ship[];
const pageMuted = "rgba(255,255,255,0.55)";
const pageText = "rgba(255,255,255,0.92)";

function InfoBlock({
  icon,
  label,
  value,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  delay: number;
}) {
  return (
    <Grow in timeout={500 + delay}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#1d1f20",
          border: "1px solid rgba(255,255,255,0.08)",
          transition: "border-color 0.2s ease",
          "&:hover": { borderColor: "rgba(6,182,212,0.4)" },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
          {icon}
          <Typography variant="caption" sx={{ color: pageMuted }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={700} sx={{ color: pageText }}>
          {value}
        </Typography>
      </Box>
    </Grow>
  );
}

export default function ShipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isTracked, toggleTracked } = useWatchlist();

  const ship = useMemo(() => allShips.find((s) => s.id === id) ?? null, [id]);

  if (!ship) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Ship not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/ship")}>
          Back to Fleet
        </Button>
      </Box>
    );
  }

  const typeConfig = SHIP_TYPE_CONFIG[ship.shipType];
  const lastUpdate = new Date(ship.lastUpdate).toLocaleString();
  const headingLabel = `${ship.heading_deg}°`;

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ position: "relative", height: { xs: 220, md: 300 }, overflow: "hidden" }}>
        <ShipThumb
          shipType={ship.shipType}
          iconSize={340}
          sx={{
            animation: "heroZoom 8s ease-out forwards",
            "@keyframes heroZoom": {
              from: { transform: "scale(1.1)" },
              to: { transform: "scale(1)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, #0f1113 0%, rgba(15,17,19,0.6) 50%, rgba(15,17,19,0.3) 100%)",
          }}
        />
        <IconButton
          onClick={() => navigate("/ship")}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            bgcolor: "rgba(0,0,0,0.5)",
            color: "#fff",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          }}
        >
          <ArrowBack />
        </IconButton>
        <IconButton
          onClick={() => toggleTracked(ship.id, ship.name)}
          aria-label={isTracked(ship.id) ? "Stop tracking vessel" : "Track vessel"}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            bgcolor: "rgba(0,0,0,0.5)",
            color: isTracked(ship.id) ? "#22d3ee" : "#fff",
            border: "1px solid",
            borderColor: isTracked(ship.id)
              ? "rgba(34,211,238,0.6)"
              : "transparent",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)", color: "#22d3ee" },
          }}
        >
          {isTracked(ship.id) ? <PushPin /> : <PushPinOutlined />}
        </IconButton>
        <Fade in timeout={600}>
          <Box sx={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <DirectionsBoat sx={{ color: typeConfig.color }} />
              <Typography variant="h4" fontWeight={800} color="#fff">
                {ship.name}
              </Typography>
              <Chip
                label={typeConfig.label}
                size="small"
                sx={{ bgcolor: typeConfig.color, color: "#0b1117", fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="body1" color="rgba(255,255,255,0.75)">
              {ship.operator} · MMSI {ship.mmsi} · {ship.id}
            </Typography>
          </Box>
        </Fade>
      </Box>

      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Fade in timeout={700}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            mb={3}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "#1d1f20",
                border: "1px solid rgba(255,255,255,0.08)",
                flex: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Anchor sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="overline" sx={{ color: pageMuted }}>
                  Voyage
                </Typography>
              </Stack>
              <Typography variant="h6" fontWeight={700} sx={{ color: pageText }}>
                {ship.origin_port} → {ship.destination_port}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Explore />}
              onClick={() => navigate(`/?select=${ship.id}`)}
              sx={{ py: 1.25, px: 3, fontWeight: 600, flexShrink: 0 }}
            >
              View on Map
            </Button>
          </Stack>
        </Fade>

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: pageText }}>
          Voyage Telemetry
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: 3,
          }}
        >
          <InfoBlock
            icon={<Speed sx={{ fontSize: 18, color: "primary.main" }} />}
            label="Speed Over Ground"
            value={`${ship.speed_kts} kn`}
            delay={0}
          />
          <InfoBlock
            icon={<Explore sx={{ fontSize: 18, color: "primary.main" }} />}
            label="Heading"
            value={headingLabel}
            delay={80}
          />
          <InfoBlock
            icon={<Waves sx={{ fontSize: 18, color: "primary.main" }} />}
            label="Draft"
            value={`${ship.draft_m} m`}
            delay={160}
          />
          <InfoBlock
            icon={<Schedule sx={{ fontSize: 18, color: "primary.main" }} />}
            label="Last Update"
            value={lastUpdate}
            delay={240}
          />
        </Box>

        <Fade in timeout={900}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "#1d1f20",
              border: "1px solid rgba(255,255,255,0.08)",
              mb: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <LocationOn sx={{ color: "primary.main" }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: pageText }}>
                Current Position
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: pageMuted }} gutterBottom>
              Latitude: {ship.lat.toFixed(4)}° · Longitude: {ship.lon.toFixed(4)}°
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: pageText }}>
              Route Waypoints ({ship.path.length})
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 1, maxHeight: 320, overflow: "auto" }}>
              {ship.path.map((point, i) => (
                <Grow in key={i} timeout={400 + Math.min(i, 10) * 50}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 1.5,
                      bgcolor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Chip
                      label={i + 1}
                      size="small"
                      sx={{
                        width: 28,
                        height: 24,
                        fontSize: "0.7rem",
                        bgcolor: "primary.main",
                        color: "#fff",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: pageText }}>
                      {point[0].toFixed(3)}°, {point[1].toFixed(3)}°
                    </Typography>
                  </Box>
                </Grow>
              ))}
            </Stack>
          </Box>
        </Fade>

        <Fade in timeout={1000}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "#1d1f20",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Straighten sx={{ color: "primary.main", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: pageText }}>
                Vessel Details
              </Typography>
            </Stack>
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {[
                ["Ship ID", ship.id],
                ["Name", ship.name],
                ["MMSI", ship.mmsi],
                ["Operator", ship.operator],
                ["Vessel Type", typeConfig.label],
                ["Length Overall", `${ship.length_m} m`],
                ["Draft", `${ship.draft_m} m`],
                ["Origin", ship.origin_port],
                ["Destination", ship.destination_port],
              ].map(([label, value], i, arr) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.75,
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                  }}
                >
                  <Typography variant="body2" sx={{ color: pageMuted }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: pageText }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
