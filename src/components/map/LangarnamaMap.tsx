import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { Map, Source, Layer } from "react-map-gl/maplibre";
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

const ZOOM_BOX_POSITION = "top-left";
const TOOLBAR_POSITION = "top-right";
const MAP_VIEW = "bottom-right";

interface LangarnamaMapProps {
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

const LangarnamaMap: FC<LangarnamaMapProps> = ({ children }) => {
  const mapStyleId = useAppSelector((state) => state.settings.mapStyleId);
  const bootMapStyleRef = useRef<string | Record<string, unknown> | null>(null);
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
        mapLib={maplibregl}
        initialViewState={initialViewState}
        mapStyle={bootMapStyleRef.current as any}
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
        {/* Native dark shadow layer rendered below the deck.gl overlay */}
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


          </AccordionGroupProvider>
        </MapToolProvider>
      </Map>
    </div>
  );
};

export default LangarnamaMap;
