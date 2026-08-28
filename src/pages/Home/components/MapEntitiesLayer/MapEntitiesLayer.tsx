import { useCallback, useMemo } from "react";
import DeckGLOverlay from "../../../../components/map/components/DeckGLOverlay/DeckGLOverlay";
import { useShips } from "../ShipLayer/context/ShipContext";
import {
  useLiveShipEngine,
  useLiveShipSnapshot,
} from "../ShipLayer/context/LiveShipContext";
import { createShipIconLayer } from "../ShipLayer/layers/createShipLayer";
import { createWakePathLayer } from "../ShipLayer/layers/createWakePathLayer";
import type { Ship } from "../ShipLayer/types/Ship";
import { createPortLayer } from "../PortLayer/layers/createPortLayer";
import type { Port } from "../PortLayer/types/Port";
import { createStationLayer } from "../StationLayer/layers/createStationLayer";
import type { CoastalStation } from "../StationLayer/types/CoastalStation";
import { useMapLayers } from "../../context/MapLayersContext";
import { useStableMapCursor } from "../../hooks/useStableMapCursor";
import { useAppSelector } from "../../../../store/hooks";
import {
  isDrawToolActive,
  useMapTool,
} from "../../../../components/map/context/MapToolContext";

const MapEntitiesLayer = () => {
  const { isItemVisible, isShipVisible, selectEntity, ports, stations } = useMapLayers();
  const { wakes } = useShips();
  const liveShips = useLiveShipSnapshot();
  const { getWakePath } = useLiveShipEngine();
  const handleHover = useStableMapCursor("map-entities");
  const { shipSize, showShipLabels, mapStyleId } = useAppSelector(
    (state) => state.settings
  );
  const { activeTool } = useMapTool();
  const pickable = !isDrawToolActive(activeTool);

  const visibleShips = useMemo(
    () => liveShips.filter((s) => isShipVisible(s)),
    [liveShips, isShipVisible]
  );

  const visiblePorts = useMemo(
    () => ports.filter((p) => isItemVisible("ports", p.id)),
    [ports, isItemVisible]
  );

  const visibleStations = useMemo(
    () => stations.filter((s) => isItemVisible("stations", s.id)),
    [stations, isItemVisible]
  );

  const handleShipClick = useCallback(
    (ship: Ship) => selectEntity("ships", ship.id),
    [selectEntity]
  );

  const handlePortClick = useCallback(
    (port: Port) => selectEntity("ports", port.id),
    [selectEntity]
  );

  const handleStationClick = useCallback(
    (station: CoastalStation) => selectEntity("stations", station.id),
    [selectEntity]
  );

  const visibleWakes = useMemo(
    () => wakes.filter((w) => w.visible),
    [wakes]
  );

  const portLayer = useMemo(() => {
    if (visiblePorts.length === 0) return null;
    return createPortLayer(visiblePorts, {
      onPortClick: handlePortClick,
      onPortHover: handleHover,
      pickable,
    });
  }, [visiblePorts, handlePortClick, handleHover, pickable]);

  const stationLayer = useMemo(() => {
    if (visibleStations.length === 0) return null;
    return createStationLayer(visibleStations, {
      onStationClick: handleStationClick,
      onStationHover: handleHover,
      pickable,
    });
  }, [visibleStations, handleStationClick, handleHover, pickable]);

  const layers = useMemo(() => {
    const result = [];

    visibleWakes.forEach((wake) => {
      const ship = liveShips.find((s) => s.id === wake.shipId);
      if (ship) {
        const wakeLayers = createWakePathLayer(ship, getWakePath(wake.shipId));
        if (wakeLayers) result.push(...wakeLayers);
      }
    });

    if (portLayer) {
      result.push(portLayer);
    }

    if (stationLayer) {
      result.push(stationLayer);
    }

    if (visibleShips.length > 0) {
      result.push(
        ...createShipIconLayer(visibleShips, {
          onShipClick: handleShipClick,
          onShipHover: handleHover,
          iconSize: shipSize,
          showLabels: showShipLabels,
          pickable,
          layerKey: mapStyleId,
        })
      );
    }

    return result;
  }, [
    visibleWakes,
    liveShips,
    getWakePath,
    portLayer,
    stationLayer,
    visibleShips,
    handleShipClick,
    handleHover,
    shipSize,
    showShipLabels,
    pickable,
    mapStyleId,
  ]);

  return <DeckGLOverlay key={mapStyleId} layers={layers} />;
};

export default MapEntitiesLayer;
