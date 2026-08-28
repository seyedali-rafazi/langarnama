import { Box, Tooltip, IconButton, useTheme } from "@mui/material";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import { useState, useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

const ThreeDControl = () => {
  const theme = useTheme();
  const [is3D, setIs3D] = useState(false);
  const { current: map } = useMap();

  // Toggle between flat 2D and tilted 3D
  const toggle3D = () => {
    if (!map) return;

    if (is3D) {
      // Return to flat 2D view (0deg pitch)
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    } else {
      // Tilt to 3D view (e.g., 60deg pitch)
      map.easeTo({ pitch: 60, duration: 1000 });
    }
  };

  // Keep button state in sync if the user manually changes pitch
  useEffect(() => {
    if (!map) return;

    const handlePitchChange = () => {
      const currentPitch = map.getPitch();
      setIs3D(currentPitch > 20);
    };

    map.on("pitch", handlePitchChange);
    handlePitchChange();

    return () => {
      map.off("pitch", handlePitchChange);
    };
  }, [map]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Tooltip
        title={is3D ? "Switch to 2D View" : "Switch to 3D View"}
        placement="left"
        arrow
      >
        <IconButton
          onClick={toggle3D}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: `${theme.palette.primary.main} !important`,
              color: "white",
            },
            boxShadow: 1,
            transform: is3D ? "rotateX(20deg)" : "none",
            transition: "transform 0.3s ease",
          }}
        >
          <ThreeDRotationIcon
            fontSize="small"
            color={is3D ? "primary" : "inherit"}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ThreeDControl;
