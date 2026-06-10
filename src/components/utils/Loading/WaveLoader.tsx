import { DirectionsBoat } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

const MONO = '"JetBrains Mono", "Cascadia Code", "Roboto Mono", monospace';

interface WaveLoaderProps {
  /** Status line shown under the waves, e.g. "LOADING REGISTRY". */
  label?: string;
  /** Fill the parent (default) or render compactly inline. */
  compact?: boolean;
}

/**
 * In-app loading indicator: a vessel bobbing over two drifting wave layers,
 * used as Suspense fallback for lazily loaded routes.
 */
export default function WaveLoader({ label = "LOADING", compact = false }: WaveLoaderProps) {
  return (
    <Box
      sx={{
        height: compact ? "auto" : "100%",
        py: compact ? 3 : 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: compact ? "transparent" : "#0b1014",
      }}
    >
      <Box sx={{ position: "relative", width: 180, height: 90, overflow: "hidden" }}>
        {/* bobbing vessel */}
        <DirectionsBoat
          sx={{
            position: "absolute",
            left: "50%",
            top: 8,
            ml: "-19px",
            fontSize: 38,
            color: "#22d3ee",
            filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))",
            animation: "waveloader-bob 2.6s ease-in-out infinite",
            "@keyframes waveloader-bob": {
              "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
              "50%": { transform: "translateY(-7px) rotate(4deg)" },
            },
          }}
        />
        {/* back wave */}
        <Box
          component="svg"
          viewBox="0 0 360 28"
          preserveAspectRatio="none"
          sx={{
            position: "absolute",
            bottom: 14,
            left: 0,
            width: "200%",
            height: 24,
            opacity: 0.4,
            animation: "waveloader-drift 4s linear infinite",
            "@keyframes waveloader-drift": {
              from: { transform: "translateX(0)" },
              to: { transform: "translateX(-50%)" },
            },
          }}
        >
          <path
            d="M0 14 Q 22.5 0, 45 14 T 90 14 T 135 14 T 180 14 T 225 14 T 270 14 T 315 14 T 360 14 V 28 H 0 Z"
            fill="rgba(6,182,212,0.35)"
          />
        </Box>
        {/* front wave */}
        <Box
          component="svg"
          viewBox="0 0 360 28"
          preserveAspectRatio="none"
          sx={{
            position: "absolute",
            bottom: 4,
            left: 0,
            width: "200%",
            height: 26,
            animation: "waveloader-drift 2.4s linear infinite",
          }}
        >
          <path
            d="M0 14 Q 22.5 2, 45 14 T 90 14 T 135 14 T 180 14 T 225 14 T 270 14 T 315 14 T 360 14 V 28 H 0 Z"
            fill="rgba(34,211,238,0.55)"
          />
        </Box>
      </Box>

      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: "0.62rem",
          letterSpacing: "0.24em",
          color: "rgba(255,255,255,0.5)",
          "&::after": {
            content: '"..."',
            display: "inline-block",
            width: "1.4em",
            textAlign: "left",
            color: "#22d3ee",
            animation: "waveloader-dots 1.4s steps(4) infinite",
          },
          "@keyframes waveloader-dots": {
            "0%": { clipPath: "inset(0 100% 0 0)" },
            "100%": { clipPath: "inset(0 -10% 0 0)" },
          },
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
