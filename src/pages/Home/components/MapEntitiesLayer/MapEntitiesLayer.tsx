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
import portData from "../PortLayer/data/iran_ports.json";
import { createPortLayer } from "../PortLayer/layers/createPortLayer";
import type { Port } from "../PortLayer/types/Port";
import stationData from "../StationLayer/data/iran_coastal_stations.json";
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
  const { isItemVisible, isShipVisible, selectEntity } = useMapLayers();
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
    () => (portData as Port[]).filter((p) => isItemVisible("ports", p.id)),
    [isItemVisible]
  );

  const visibleStations = useMemo(
    () =>
      (stationData as CoastalStation[]).filter((s) =>
        isItemVisible("stations", s.id)
      ),
    [isItemVisible]
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

  const layers = useMemo(() => {
    const result = [];

    visibleWakes.forEach((wake) => {
      const ship = liveShips.find((s) => s.id === wake.shipId);
      if (ship) {
        const wakeLayers = createWakePathLayer(ship, getWakePath(wake.shipId));
        if (wakeLayers) result.push(...wakeLayers);
      }
    });

    if (visiblePorts.length > 0) {
      result.push(
        createPortLayer(visiblePorts, {
          onPortClick: handlePortClick,
          onPortHover: handleHover,
          pickable,
        })
      );
    }

    if (visibleStations.length > 0) {
      result.push(
        createStationLayer(visibleStations, {
          onStationClick: handleStationClick,
          onStationHover: handleHover,
          pickable,
        })
      );
    }

    if (visibleShips.length > 0) {
      result.push(
        ...createShipIconLayer(visibleShips, {
          onShipClick: handleShipClick,
          onShipHover: handleHover,
          iconSize: shipSize,
          showLabels: showShipLabels,
          pickable,
        })
      );
    }

    return result;
  }, [
    visibleWakes,
    liveShips,
    getWakePath,
    visibleShips,
    visiblePorts,
    visibleStations,
    handleShipClick,
    handlePortClick,
    handleStationClick,
    handleHover,
    shipSize,
    showShipLabels,
    pickable,
  ]);

  return <DeckGLOverlay key={mapStyleId} layers={layers} />;
};

export default MapEntitiesLayer;
