import os

files = {}

files["src/pages/Home/components/ShipLayer/context/LiveShipContext.tsx"] = """import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BASE_SHIPS } from "../data/shipFleet";
import type { Ship } from "../types/Ship";
import {
  advanceShipSim,
  buildWakePath,
  getVoyageProgress,
  initShipSim,
  type ShipSimState,
  type VoyageProgress,
} from "../utils/shipMovement";
import { fetchShips, getWebSocketUrl, type ShipListResponse } from "../../../../../services/api";

export { BASE_SHIPS } from "../data/shipFleet";

type WakePoint = [number, number];
type Listener = () => void;
export type StreamState = "connected" | "connecting" | "disconnected";

interface LiveShipContextValue {
  getShipById: (id: string) => Ship | null;
  getWakePath: (id: string) => WakePoint[];
  getVoyage: (id: string) => VoyageProgress | null;
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => Ship[];
  streamState: StreamState;
  liveCount: number;
  totalCount: number;
}

const LiveShipContext = createContext<LiveShipContextValue | null>(null);

export function LiveShipProvider({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  const listenersRef = useRef<Set<Listener>>(new Set());
  const simStatesRef = useRef<Map<string, ShipSimState>>(new Map());
  const routesRef = useRef<Map<string, [number, number][]>>(new Map());
  const shipsRef = useRef<Ship[]>([]);
  const liveShipsMapRef = useRef<Map<string, Ship>>(new Map());

  const [streamState, setStreamState] = useState<StreamState>("connecting");
  const [liveCount, setLiveCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(BASE_SHIPS.length);

  // Initialize baseline ships if empty
  if (shipsRef.current.length === 0) {
    const simMap = new Map<string, ShipSimState>();
    const routeMap = new Map<string, [number, number][]>();

    shipsRef.current = BASE_SHIPS.map((item) => {
      const sim = initShipSim(item);
      simMap.set(item.id, sim);
      routeMap.set(item.id, item.path);
      return {
        ...item,
        lat: sim.lat,
        lon: sim.lon,
        heading_deg: sim.heading_deg,
      };
    });

    simStatesRef.current = simMap;
    routesRef.current = routeMap;
  }

  const activeRef = useRef(active);
  activeRef.current = active;

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const getSnapshot = useCallback(() => shipsRef.current, []);

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  // Update fleet state with incoming batch of ships from REST/WebSocket
  const ingestIncomingShips = useCallback((incomingShips: Ship[]) => {
    if (!incomingShips || incomingShips.length === 0) return;

    let updatedLiveCount = 0;
    const incomingMap = new Map<string, Ship>();

    for (const ship of incomingShips) {
      if (ship.is_live) {
        updatedLiveCount++;
      }
      incomingMap.set(ship.id, ship);
      if (ship.mmsi) {
        incomingMap.set(ship.mmsi, ship);
      }
    }

    // Merge incoming real ships with simulated baseline
    const combinedMap = new Map<string, Ship>();

    // Add baseline ships first
    for (const base of BASE_SHIPS) {
      const current = shipsRef.current.find((s) => s.id === base.id);
      combinedMap.set(base.id, current || base);
    }

    // Overlay or add incoming ships
    for (const ship of incomingShips) {
      const normalizedShip: Ship = {
        ...ship,
        path: (ship.path && ship.path.length > 0) ? (ship.path as [number, number][]) : [[ship.lat, ship.lon]],
      };
      combinedMap.set(ship.id, normalizedShip);
      liveShipsMapRef.current.set(ship.id, normalizedShip);
    }

    shipsRef.current = Array.from(combinedMap.values());
    setLiveCount(updatedLiveCount);
    setTotalCount(shipsRef.current.length);
    notify();
  }, [notify]);

  // Live WebSocket Ingestion & Polling Fallback
  useEffect(() => {
    if (!active) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let isSubscribed = true;

    const connectWebSocket = () => {
      try {
        const wsUrl = getWebSocketUrl();
        setStreamState("connecting");
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isSubscribed) return;
          setStreamState("connected");
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data: ShipListResponse = JSON.parse(event.data);
            if (data && Array.isArray(data.ships)) {
              ingestIncomingShips(data.ships);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setStreamState("disconnected");
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setStreamState("disconnected");
          // Reconnect with backoff
          reconnectTimer = setTimeout(connectWebSocket, 4000);
        };
      } catch {
        setStreamState("disconnected");
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      }
    };

    // Initial REST fetch to populate live cache immediately
    fetchShips()
      .then((res) => {
        if (isSubscribed && res && Array.isArray(res.ships) && res.ships.length > 0) {
          ingestIncomingShips(res.ships);
        }
      })
      .catch(() => {
        // Handled by fallback baseline
      });

    // Start WebSocket
    connectWebSocket();

    // Fallback polling every 10s if WebSocket disconnects
    pollInterval = setInterval(() => {
      if (!isSubscribed) return;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        fetchShips()
          .then((res) => {
            if (isSubscribed && res && Array.isArray(res.ships)) {
              ingestIncomingShips(res.ships);
            }
          })
          .catch(() => {});
      }
    }, 10000);

    return () => {
      isSubscribed = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [active, ingestIncomingShips]);

  // Animation Loop for Simulated Baseline Vessels
  useEffect(() => {
    if (!active) return;

    let frameId = 0;
    let lastTime = performance.now();
    let renderAccumulator = 0;
    const renderInterval = 1 / 20;
    const TIME_SCALE = 30;

    const tick = (now: number) => {
      if (!activeRef.current) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      renderAccumulator += delta;

      // Update simulation positions for baseline simulated vessels
      for (const item of BASE_SHIPS) {
        const route = routesRef.current.get(item.id) ?? item.path;
        const currentSim =
          simStatesRef.current.get(item.id) ?? initShipSim(item);
        const nextSim = advanceShipSim(
          currentSim,
          route,
          item.speed_kts,
          delta * TIME_SCALE
        );
        simStatesRef.current.set(item.id, nextSim);
      }

      if (renderAccumulator >= renderInterval) {
        renderAccumulator = 0;
        shipsRef.current = shipsRef.current.map((item) => {
          // If vessel is a real live ship from AISStream, keep its live coordinates
          if (item.is_live) {
            return item;
          }
          // Otherwise apply simulation physics
          const sim = simStatesRef.current.get(item.id);
          if (!sim) return item;
          return {
            ...item,
            lat: sim.lat,
            lon: sim.lon,
            heading_deg: sim.heading_deg,
          };
        });
        notify();
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, notify]);

  const getShipById = useCallback(
    (id: string) => shipsRef.current.find((item) => item.id === id || item.mmsi === id) ?? null,
    []
  );

  const getWakePath = useCallback((id: string): WakePoint[] => {
    const ship = shipsRef.current.find((s) => s.id === id || s.mmsi === id);
    if (!ship) return [];

    // If live ship with path points
    if (ship.is_live && ship.path && ship.path.length > 0) {
      const wake: WakePoint[] = ship.path.map(([lat, lon]) => [lon, lat]);
      // Ensure current position is at the end of wake
      const lastPoint = wake[wake.length - 1];
      if (!lastPoint || lastPoint[0] !== ship.lon || lastPoint[1] !== ship.lat) {
        wake.push([ship.lon, ship.lat]);
      }
      return wake;
    }

    // Baseline simulated vessel
    const baseItem = BASE_SHIPS.find((s) => s.id === id);
    if (!baseItem) return [[ship.lon, ship.lat]];

    const sim = simStatesRef.current.get(id);
    return buildWakePath(ship, sim);
  }, []);

  const getVoyage = useCallback((id: string): VoyageProgress | null => {
    const ship = shipsRef.current.find((s) => s.id === id || s.mmsi === id);
    if (!ship) return null;

    if (ship.is_live) {
      const path = ship.path || [];
      return {
        totalNm: 0,
        traveledNm: path.length,
        remainingNm: 0,
        etaMinutes: ship.eta ? 60 : null,
      };
    }

    const baseItem = BASE_SHIPS.find((s) => s.id === id);
    if (!baseItem) return null;
    return getVoyageProgress(baseItem, simStatesRef.current.get(id));
  }, []);

  const value = useMemo(
    () => ({
      getShipById,
      getWakePath,
      getVoyage,
      subscribe,
      getSnapshot,
      streamState,
      liveCount,
      totalCount,
    }),
    [getShipById, getWakePath, getVoyage, subscribe, getSnapshot, streamState, liveCount, totalCount]
  );

  return (
    <LiveShipContext.Provider value={value}>
      {children}
    </LiveShipContext.Provider>
  );
}

export function useLiveShipSnapshot(): Ship[] {
  const context = useContext(LiveShipContext);
  if (!context) {
    throw new Error("useLiveShipSnapshot must be used within LiveShipProvider");
  }
  return useSyncExternalStore(
    context.subscribe,
    context.getSnapshot,
    context.getSnapshot
  );
}

export function useLiveShipEngine() {
  const context = useContext(LiveShipContext);
  if (!context) {
    throw new Error("useLiveShipEngine must be used within LiveShipProvider");
  }
  return context;
}
"""

files["src/pages/Home/context/MapLayersContext.tsx"] = """import {
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
  const { getShipById } = useLiveShipEngine();
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
      isLoadingReferenceData: isLoadingPorts || isLoadingStations,
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
"""

files["src/pages/Home/components/ShipLegend/ShipLegend.tsx"] = """import { ExpandLess, ExpandMore, Sailing } from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { BASE_SHIPS } from "../ShipLayer/data/shipFleet";
import {
  SHIP_TYPES,
  SHIP_TYPE_CONFIG,
  type ShipType,
} from "../ShipLayer/types/Ship";
import { useMapLayers } from "../../context/MapLayersContext";
import {
  useLiveShipEngine,
  useLiveShipSnapshot,
} from "../ShipLayer/context/LiveShipContext";

export default function ShipLegend() {
  const { shipTypeVisibility, toggleShipType, categoryEnabled } = useMapLayers();
  const { streamState } = useLiveShipEngine();
  const liveShips = useLiveShipSnapshot();
  const [open, setOpen] = useState(true);

  const allShips = liveShips.length > 0 ? liveShips : BASE_SHIPS;

  const counts = useMemo(() => {
    const result = Object.fromEntries(SHIP_TYPES.map((t) => [t, 0])) as Record<
      ShipType,
      number
    >;
    for (const ship of allShips) {
      if (result[ship.shipType] !== undefined) {
        result[ship.shipType] += 1;
      }
    }
    return result;
  }, [allShips]);

  if (!categoryEnabled.ships) return null;

  const isLive = streamState === "connected";

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "10px",
        bgcolor: "rgba(20,24,27,0.92)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        width: 178,
        pointerEvents: "auto",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        onClick={() => setOpen((v) => !v)}
        sx={{ px: 1.25, py: 0.75, cursor: "pointer", userSelect: "none" }}
      >
        <Sailing sx={{ fontSize: 15, color: "primary.light" }} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ flex: 1, letterSpacing: 0.4, color: "text.primary" }}
        >
          Vessels ({allShips.length})
        </Typography>
        <Tooltip
          title={
            isLive
              ? "Connected to AISStream.io Live Stream"
              : streamState === "connecting"
              ? "Connecting to AISStream.io..."
              : "Running Local Simulation / Cache"
          }
          arrow
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: isLive ? "#22c55e" : streamState === "connecting" ? "#facc15" : "#06b6d4",
              boxShadow: isLive
                ? "0 0 6px rgba(34,197,94,0.9)"
                : "0 0 6px rgba(6,182,212,0.9)",
              animation: "legend-pulse 2s infinite ease-in-out",
              "@keyframes legend-pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
            }}
          />
        </Tooltip>
        <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
          {open ? (
            <ExpandLess sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMore sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Stack spacing={0.5} sx={{ px: 1.25, pb: 1 }}>
          {SHIP_TYPES.map((type) => {
            const config = SHIP_TYPE_CONFIG[type];
            const visible = shipTypeVisibility[type] ?? true;
            return (
              <Stack
                key={type}
                direction="row"
                alignItems="center"
                spacing={0.75}
                onClick={() => toggleShipType(type)}
                sx={{
                  cursor: "pointer",
                  opacity: visible ? 1 : 0.4,
                  py: 0.25,
                  px: 0.5,
                  borderRadius: "6px",
                  transition: "opacity 0.15s, background-color 0.15s",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "2px",
                    bgcolor: config.color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    textDecoration: visible ? "none" : "line-through",
                  }}
                >
                  {config.shortLabel}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: visible ? "text.primary" : "text.disabled",
                    bgcolor: "rgba(255,255,255,0.06)",
                    px: 0.6,
                    py: 0.1,
                    borderRadius: "4px",
                  }}
                >
                  {counts[type]}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Collapse>
    </Paper>
  );
}
"""

files["src/pages/Home/components/ShipLayer/components/WakesPanel/WakesPanel.tsx"] = """import { Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { SHIP_TYPE_CONFIG } from "../../types/Ship";
import { useShips } from "../../context/ShipContext";
import { useLiveShipEngine } from "../../context/LiveShipContext";

export default function WakesPanel() {
  const { wakes, toggleWakeVisibility, removeWake } = useShips();
  const { getShipById } = useLiveShipEngine();

  const wakeItems = useMemo(
    () =>
      wakes.map((wake) => {
        const ship = getShipById(wake.shipId);
        return { wake, ship };
      }),
    [wakes, getShipById]
  );

  if (wakes.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No voyage wakes drawn yet.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Click a ship on the map and press Draw Wake.
        </Typography>
      </Box>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {wakeItems.map(({ wake, ship }) => (
        <ListItem
          key={wake.shipId}
          disablePadding
          sx={{
            mb: 1,
            borderRadius: 2,
            bgcolor: "grey.A100",
            border: "1px solid",
            borderColor: wake.visible ? "primary.main" : "divider",
            opacity: wake.visible ? 1 : 0.6,
            transition: "all 0.2s ease",
          }}
          secondaryAction={
            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton
                edge="end"
                size="small"
                onClick={() => toggleWakeVisibility(wake.shipId)}
                sx={{ color: wake.visible ? "primary.main" : "text.secondary" }}
                title={wake.visible ? "Hide wake" : "Show wake"}
              >
                {wake.visible ? (
                  <Visibility fontSize="small" />
                ) : (
                  <VisibilityOff fontSize="small" />
                )}
              </IconButton>
              <IconButton
                edge="end"
                size="small"
                onClick={() => removeWake(wake.shipId)}
                sx={{ color: "error.main" }}
                title="Remove wake"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <ListItemText
            sx={{ px: 1.5, py: 1, pr: 7 }}
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: ship
                      ? SHIP_TYPE_CONFIG[ship.shipType].color
                      : "text.secondary",
                  }}
                />
                <Typography variant="body2" fontWeight={700} noWrap>
                  {ship?.name ?? wake.shipId}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {ship
                  ? `${ship.origin_port} → ${ship.destination_port}`
                  : "Unknown voyage"}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
"""

base = "d:/web project/langarnama/lng"
for rel_path, content in files.items():
    full_path = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully wrote {rel_path}, size: {os.path.getsize(full_path)} bytes")
