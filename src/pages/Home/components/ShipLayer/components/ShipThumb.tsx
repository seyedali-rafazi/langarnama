import { DirectionsBoat } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { getShipVisual } from "../utils/getShipVisual";

interface ShipThumbProps {
  shipType: string;
  className?: string;
  iconSize?: number;
  sx?: SxProps<Theme>;
}

export default function ShipThumb({
  shipType,
  className,
  iconSize = 150,
  sx,
}: ShipThumbProps) {
  const visual = getShipVisual(shipType);

  return (
    <Box
      className={className}
      sx={{
        position: "absolute",
        inset: 0,
        background: visual.gradient,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 72% 22%, rgba(255,255,255,0.22), transparent 55%)",
        }}
      />
      {/* wave ripple texture */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-radial-gradient(circle at 30% 110%, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 22px)",
        }}
      />
      <DirectionsBoat
        sx={{
          position: "absolute",
          right: -iconSize * 0.12,
          bottom: -iconSize * 0.18,
          fontSize: iconSize,
          color: "rgba(255,255,255,0.16)",
          transform: "rotate(-8deg)",
        }}
      />
    </Box>
  );
}
