import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LangarnamaMap from "../../components/map/LangarnamaMap";
import MapActivityController from "../../components/map/components/MapActivityController/MapActivityController";
import MapControlBox from "../../components/map/components/MapControlBox";
import MapEntitiesLayer from "./components/MapEntitiesLayer/MapEntitiesLayer";
import MapFocusController from "./components/MapFocusController/MapFocusController";
import MapItemPopup from "./components/MapItemPopup/MapItemPopup";
import ShipLegend from "./components/ShipLegend/ShipLegend";
import { useMapLayers } from "./context/MapLayersContext";
import CoordinateDisplay from "../../components/map/components/CoordinateDisplay/CoordinateDisplay";

interface HomePageProps {
  mapActive?: boolean;
}

const HomePage = ({ mapActive = true }: HomePageProps) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { focusEntity } = useMapLayers();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const COORDINATE_POSITION = "bottom-left";


  useEffect(() => {
    const shipId = searchParams.get("select");
    if (!shipId) return;

    focusEntity("ships", shipId);
    setSearchParams({}, { replace: true });
  }, [searchParams, focusEntity, setSearchParams]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <LangarnamaMap>
        {!isMobile && (
          <MapControlBox position={COORDINATE_POSITION}>
            <CoordinateDisplay />
          </MapControlBox>
        )}
        <MapActivityController active={mapActive} />
        <MapFocusController />
        <MapEntitiesLayer />
        <MapControlBox position="bottom-left" margin={{ top: 0, bottom: 24, left: 24, right: 0 }}>
          <ShipLegend />
        </MapControlBox>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 5,
            overflow: "hidden",
          }}
        >
          <MapItemPopup />
        </Box>

      </LangarnamaMap>
    </Box>
  );
};

export default HomePage;
