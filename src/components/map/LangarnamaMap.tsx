import "mapbox-gl/dist/mapbox-gl.css";
import { Map, Source, Layer } from "react-map-gl/mapbox";
import CoordinateDisplay from "./components/CoordinateDisplay/CoordinateDisplay";
import MapControlBox from "./components/MapControlBox";
import MapNavigator from "./components/MapNavigator/MapNavigator";
import { useMediaQuery, useTheme } from "@mui/material";
import MapDrawTools from "./components/MapDrawTool/MapDrawTools";
import ExtraMapTools from "./components/ExtraMapTools/ExtraMapTools";
import MapView from "./components/MapView/MapView";
import MapResizeHandler from "./components/MapResizeHandler/MapResizeHandler";
import { useRef, type FC, type ReactNode } from "react";
import { useAppSelector } from "../../store/hooks";
import { getMapStyleUrl } from "../../store/mapStyles";
import MapFlatViewEnforcer from "./components/MapFlatViewEnforcer/MapFlatViewEnforcer";
import MapStyleSynchronizer from "./components/MapStyleSynchronizer/MapStyleSynchronizer";
import { MapToolProvider } from "./context/MapToolContext";
import { AccordionGroupProvider } from "../utils/MapTools/AccordionGroupContext";
import MapShipBadge from "../../pages/Home/components/MapShipBadge/MapShipBadge";
import ShipLegend from "../../pages/Home/components/ShipLegend/ShipLegend";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.REACT_APP_MAPBOX_TOKEN;

const ZOOM_BOX_POSITION = "top-left";
const COORDINATE_POSITION = "bottom-left";
const TOOLBAR_POSITION = "top-right";
const MAP_VIEW = "bottom-right";

interface MapboxMapProps {
  children?: ReactNode;
}

// Polygon covering the entire world (used for the dark shadow overlay)
const worldPolygon = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, 90],
            [180, 90],
            [180, -90],
            [-180, -90],
            [-180, 90],
          ],
        ],
      },
    },
  ],
};

const LangarnamaMap: FC<MapboxMapProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const mapStyleId = useAppSelector((state) => state.settings.mapStyleId);
  const bootMapStyleRef = useRef<string | null>(null);
  if (bootMapStyleRef.current === null) {
    bootMapStyleRef.current = getMapStyleUrl(mapStyleId);
  }

  // Open over Iranian waters: Persian Gulf and Strait of Hormuz in view,
  // Caspian Sea just a short pan north.
  const initialViewState = {
    longitude: 53.5,
    latitude: 29.5,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Map
        initialViewState={initialViewState}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={bootMapStyleRef.current}
        projection="mercator"
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        maxPitch={0}
        preserveDrawingBuffer={true}
        style={{ width: "100%", height: "100%" }}
      >
        <MapFlatViewEnforcer />
        <MapStyleSynchronizer />
        <MapResizeHandler />
        {/* Mapbox-native dark shadow layer rendered below the deck.gl overlay */}
        <Source
          id="dark-shadow-source"
          type="geojson"
          data={worldPolygon as any}
        >
          <Layer
            id="dark-shadow-layer"
            type="fill"
            paint={{
              "fill-color": "rgba(0, 0, 0, 0.2)",
            }}
          />
        </Source>

        <MapToolProvider>
          <AccordionGroupProvider>
            {children}

            {/* Map Controls */}
            <MapControlBox position={ZOOM_BOX_POSITION}>
              <MapNavigator />
            </MapControlBox>

            <MapControlBox position={TOOLBAR_POSITION}>
              <MapDrawTools />
            </MapControlBox>

            <MapControlBox position={TOOLBAR_POSITION}>
              <ExtraMapTools />
            </MapControlBox>

            <MapControlBox position={MAP_VIEW}>
              <MapShipBadge />
              <MapView />
            </MapControlBox>
            
            {!isMobile && (
              <MapControlBox position={COORDINATE_POSITION}>
                <CoordinateDisplay />
              </MapControlBox>
            )}
            <MapControlBox position="bottom-left">
              <ShipLegend />
            </MapControlBox>
          </AccordionGroupProvider>
        </MapToolProvider>
      </Map>
    </div>
  );
};

export default LangarnamaMap;
