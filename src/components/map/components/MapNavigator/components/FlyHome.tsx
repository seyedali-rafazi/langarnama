import { HomeFilled } from "@mui/icons-material";
import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import { useMap } from "react-map-gl/maplibre";

const FlyHome = () => {
  const { current: map } = useMap();
  const theme = useTheme();

  const handleFlyhome = () => {
    // Persian Gulf / Strait of Hormuz — the heart of the tracked fleet
    if (map) map.flyTo({ center: [53.5, 27.2], zoom: 5.6, speed: 1, curve: 1 });
  };

  return (
    <Box>
      <Tooltip title="Fly Home" placement="left" arrow>
        <IconButton
          onClick={handleFlyhome}
          size="medium"
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            color: "text.secondary",
            backgroundColor: "transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.primary.main} !important`,
              color: "white",
              transform: "scale(1.1)",
              borderRadius: "24px",
            },
          }}
        >
          <HomeFilled fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default FlyHome;
