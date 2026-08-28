import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BASE_SHIPS } from "../components/ShipLayer/data/shipFleet";
import {
  BASE_PORTS,
  BASE_STATIONS,
  usePortsQuery,
  useStationsQuery,
} from "../../../hooks/queries/useReferenceDataQuery";
import {
  useLiveShipEngine,
  useLiveShipSnapshot,
} from "../components/ShipLayer/context/LiveShipContext";
import { SHIP_TYPES, type Ship, type ShipType } from "../components/ShipLayer/types/Ship";
import type { Port } from "../components/PortLayer/types/Port";
import type { CoastalStation } from "../components/StationLayer/types/CoastalStation";

export type LayerCategory = "ships" | "ports" | "stations";

export type MapEntity = Ship | Port | CoastalStation;

type ItemVisibility = Record<LayerCategory, Record<string, boolean>>;
type ShipTypeVisibility = Record<ShipType, boolean>;

interface MapLayersContextValue {
  activeCategory: LayerCategory;
  setActiveCategory: (category: LayerCategory) => void;
  categoryEnabled: Record<LayerCategory, boolean>;
  toggleCategory: (category: LayerCategory) => void;
  itemVisibility: ItemVisibility;
  toggleItemVisibility: (category: LayerCategory, id: string) => void;
  isItemVisible: (category: LayerCategory, id: string) => boolean;
  setCategoryItemsVisibility: (category: LayerCategory, visible: boolean) => void;
  shipTypeVisibility: ShipTypeVisibility;
  toggleShipType: (type: ShipType) => void;
  isShipVisible: (ship: Ship) => boolean;
  searchQuery: Record<LayerCategory, string>;
  setSearchQuery: (category: LayerCategory, query: string) => void;
  selectedEntity: { category: LayerCategory; id: string } | null;
  selectEntity: (category: LayerCategory, id: string | null) => void;
  focusRequest: { category: LayerCategory; id: string; nonce: number } | null;
  focusEntity: (category: LayerCategory, id: string) => void;
  getEntityData: (category: LayerCategory, id: string) => MapEntity | null;
  getSelectedEntityData: () => MapEntity | null;
  ships: Ship[];
  ports: Port[];
  stations: CoastalStation[];
  isLoadingReferenceData: boolean;
}

const MapLayersContext = createContext<MapLayersContextValue | null>(null);

export function MapLayersProvider({ children }: { children: ReactNode }) {
  const { getShipById, isLoadingBackendShips } = useLiveShipEngine();
  const liveShips = useLiveShipSnapshot();
  const { data: portsData, isLoading: isLoadingPorts } = usePortsQuery();
  const { data: stationsData, isLoading: isLoadingStations } = useStationsQuery();

  const ships = liveShips.length > 0 ? liveShips : BASE_SHIPS;
  const ports = useMemo(
    () => (portsData?.ports && portsData.ports.length > 0 ? portsData.ports : BASE_PORTS),
    [portsData]
  );
  const stations = useMemo(
    () =>
      stationsData?.stations && stationsData.stations.length > 0
        ? stationsData.stations
        : BASE_STATIONS,
    [stationsData]
  );

  const [activeCategory, setActiveCategory] = useState<LayerCategory>("ships");
  const [categoryEnabled, setCategoryEnabled] = useState<Record<LayerCategory, boolean>>({
    ships: true,
    ports: true,
    stations: true,
  });

  const [itemVisibility, setItemVisibility] = useState<ItemVisibility>({
    ships: {},
    ports: {},
    stations: {},
  });

  const [shipTypeVisibility, setShipTypeVisibility] = useState<ShipTypeVisibility>(
    () => Object.fromEntries(SHIP_TYPES.map((type) => [type, true])) as ShipTypeVisibility
  );

  const [searchQuery, setSearchQueryState] = useState<Record<LayerCategory, string>>({
    ships: "",
    ports: "",
    stations: "",
  });

  const [selectedEntity, setSelectedEntity] = useState<{
    category: LayerCategory;
    id: string;
  } | null>(null);

  const [focusRequest, setFocusRequest] = useState<{
    category: LayerCategory;
    id: string;
    nonce: number;
  } | null>(null);
  const focusNonceRef = useRef(0);

  const toggleCategory = useCallback((category: LayerCategory) => {
    setCategoryEnabled((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const toggleItemVisibility = useCallback((category: LayerCategory, id: string) => {
    setItemVisibility((prev) => {
      const currentVal = prev[category]?.[id] ?? true;
      return {
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [id]: !currentVal,
        },
      };
    });
  }, []);

  const isItemVisible = useCallback(
    (category: LayerCategory, id: string) => {
      if (!categoryEnabled[category]) return false;
      return itemVisibility[category]?.[id] ?? true;
    },
    [categoryEnabled, itemVisibility]
  );

  const toggleShipType = useCallback((type: ShipType) => {
    setShipTypeVisibility((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const isShipVisible = useCallback(
    (ship: Ship) => isItemVisible("ships", ship.id) && (shipTypeVisibility[ship.shipType] ?? true),
    [isItemVisible, shipTypeVisibility]
  );

  const setCategoryItemsVisibility = useCallback((category: LayerCategory, visible: boolean) => {
    setItemVisibility((prev) => ({
      ...prev,
      [category]: Object.fromEntries(Object.keys(prev[category] || {}).map((id) => [id, visible])),
    }));
  }, []);

  const setSearchQuery = useCallback((category: LayerCategory, query: string) => {
    setSearchQueryState((prev) => ({ ...prev, [category]: query }));
  }, []);

  const getEntityData = useCallback(
    (category: LayerCategory, id: string): MapEntity | null => {
      if (category === "ships") {
        const live = getShipById(id);
        if (live) return live;
        return ships.find((s) => s.id === id || s.mmsi === id) ?? null;
      }
      if (category === "ports") {
        return (
          ports.find(
            (p) => p.id === id || p.locode.toLowerCase() === id.toLowerCase()
          ) ?? null
        );
      }
      return stations.find((s) => s.id === id) ?? null;
    },
    [getShipById, ships, ports, stations]
  );

  const selectEntity = useCallback((category: LayerCategory, id: string | null) => {
    setSelectedEntity(id ? { category, id } : null);
    if (id) {
      setActiveCategory(category);
    }
  }, []);

  const focusEntity = useCallback((category: LayerCategory, id: string) => {
    setSelectedEntity({ category, id });
    setActiveCategory(category);
    focusNonceRef.current += 1;
    setFocusRequest({ category, id, nonce: focusNonceRef.current });
  }, []);

  const getSelectedEntityData = useCallback((): MapEntity | null => {
    if (!selectedEntity) return null;
    return getEntityData(selectedEntity.category, selectedEntity.id);
  }, [selectedEntity, getEntityData]);

  const value = useMemo(
    () => ({
      activeCategory,
      setActiveCategory,
      categoryEnabled,
      toggleCategory,
      itemVisibility,
      toggleItemVisibility,
      isItemVisible,
      setCategoryItemsVisibility,
      shipTypeVisibility,
      toggleShipType,
      isShipVisible,
      searchQuery,
      setSearchQuery,
      selectedEntity,
      selectEntity,
      focusRequest,
      focusEntity,
      getEntityData,
      getSelectedEntityData,
      ships,
      ports,
      stations,
      isLoadingReferenceData: isLoadingPorts || isLoadingStations || Boolean(isLoadingBackendShips),
    }),
    [
      activeCategory,
      categoryEnabled,
      toggleCategory,
      itemVisibility,
      toggleItemVisibility,
      isItemVisible,
      setCategoryItemsVisibility,
      shipTypeVisibility,
      toggleShipType,
      isShipVisible,
      searchQuery,
      setSearchQuery,
      selectedEntity,
      selectEntity,
      focusRequest,
      focusEntity,
      getEntityData,
      getSelectedEntityData,
      ships,
      ports,
      stations,
      isLoadingPorts,
      isLoadingStations,
      isLoadingBackendShips,
    ]
  );

  return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
  const context = useContext(MapLayersContext);
  if (!context) {
    throw new Error("useMapLayers must be used within a MapLayersProvider");
  }
  return context;
}
