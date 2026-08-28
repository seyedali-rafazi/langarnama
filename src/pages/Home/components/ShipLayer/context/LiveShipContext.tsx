import {
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
import type { Ship, ShipType } from "../types/Ship";
import {
  advanceShipSim,
  buildWakePath,
  getVoyageProgress,
  initShipSim,
  type ShipSimState,
  type VoyageProgress,
} from "../utils/shipMovement";
import { useShipsQuery } from "../../../../../hooks/queries/useShipsQuery";
import { fetchShips, getWebSocketUrl } from "../../../../../services/api";

export { BASE_SHIPS } from "../data/shipFleet";

type WakePoint = [number, number];
type Listener = () => void;
export type StreamState = "connected" | "connecting" | "simulated" | "error";

export interface ViewportBounds {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

const BATCH_NOTIFY_INTERVAL_MS = 350;
const MAX_FLEET_CAPACITY = 3500;
const STALE_VESSEL_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours

interface LiveShipContextValue {
  getShipById: (id: string) => Ship | null;
  getWakePath: (id: string) => WakePoint[];
  getVoyage: (id: string) => VoyageProgress | null;
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => Ship[];
  isLoadingBackendShips: boolean;
  streamState: StreamState;
  liveMessageCount: number;
  isLiveStream: boolean;
  setViewportBounds: (bounds: ViewportBounds) => void;
}

const LiveShipContext = createContext<LiveShipContextValue | null>(null);

function mapAisTypeToShipType(typeCode?: number | string | null): ShipType {
  if (typeCode === undefined || typeCode === null) return "cargo";
  const code = Number(typeCode);
  if (code >= 30 && code <= 32) return "fishing";
  if (code === 35 || code === 55) return "military";
  if (code === 52 || (code >= 50 && code <= 59)) return "tug";
  if (code >= 60 && code <= 69) return "passenger";
  if (code >= 70 && code <= 79) return "cargo";
  if (code >= 80 && code <= 89) return "tanker";
  return "cargo";
}

/** Validates and normalizes heading (AIS standard uses 511 for 'not available') */
function normalizeHeading(
  trueHdg?: number | null,
  cog?: number | null,
  fallbackHeading?: number
): number {
  if (trueHdg !== undefined && trueHdg !== null && trueHdg >= 0 && trueHdg <= 360 && trueHdg !== 511) {
    return trueHdg;
  }
  if (cog !== undefined && cog !== null && cog >= 0 && cog <= 360 && cog !== 360) {
    return cog;
  }
  return fallbackHeading ?? 0;
}

export function LiveShipProvider({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  const { data: shipResponse, isLoading: isLoadingBackendShips } = useShipsQuery();
  const [streamState, setStreamState] = useState<StreamState>("connecting");
  const [liveMessageCount, setLiveMessageCount] = useState<number>(0);

  const listenersRef = useRef<Set<Listener>>(new Set());
  const simStatesRef = useRef<Map<string, ShipSimState>>(new Map());
  const routesRef = useRef<Map<string, [number, number][]>>(new Map());
  const liveFleetMapRef = useRef<Map<string, Ship>>(new Map());
  const baseFleetMapRef = useRef<Map<string, Ship>>(new Map());
  const shipsRef = useRef<Ship[]>([]);
  const messageCounterRef = useRef<number>(0);
  const dirtyRef = useRef<boolean>(false);
  const throttleTimerRef = useRef<number | null>(null);

  const backendWsRef = useRef<WebSocket | null>(null);
  const aisWsRef = useRef<WebSocket | null>(null);
  const viewportBoundsRef = useRef<ViewportBounds | null>(null);
  const viewportFetchAbortRef = useRef<AbortController | null>(null);

  // Initialize baseline ships
  if (baseFleetMapRef.current.size === 0) {
    const simMap = new Map<string, ShipSimState>();
    const routeMap = new Map<string, [number, number][]>();

    BASE_SHIPS.forEach((item) => {
      const sim = initShipSim(item);
      simMap.set(item.id, sim);
      routeMap.set(item.id, item.path || []);
      baseFleetMapRef.current.set(item.id, {
        ...item,
        lat: sim.lat,
        lon: sim.lon,
        heading_deg: sim.heading_deg,
      });
    });

    simStatesRef.current = simMap;
    routesRef.current = routeMap;
    shipsRef.current = Array.from(baseFleetMapRef.current.values());
  }

  const activeRef = useRef(active);
  activeRef.current = active;

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => shipsRef.current, []);

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const rebuildCombinedSnapshot = useCallback(() => {
    const mergedList: Ship[] = [];
    const seenIds = new Set<string>();
    const seenMmsi = new Set<string>();

    // Add all live stream ships
    for (const liveShip of liveFleetMapRef.current.values()) {
      mergedList.push(liveShip);
      seenIds.add(liveShip.id);
      if (liveShip.mmsi) seenMmsi.add(liveShip.mmsi);
    }

    // Add baseline / regional ships if not overridden by real live ship
    for (const baseShip of baseFleetMapRef.current.values()) {
      if (!seenIds.has(baseShip.id) && !seenMmsi.has(baseShip.mmsi)) {
        mergedList.push(baseShip);
      }
    }

    shipsRef.current = mergedList;
    notify();
  }, [notify]);

  // Throttled notification batcher to keep React render frequency steady and smooth
  const scheduleBatchedNotify = useCallback(() => {
    dirtyRef.current = true;
    if (throttleTimerRef.current !== null) return;

    throttleTimerRef.current = window.setTimeout(() => {
      throttleTimerRef.current = null;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        rebuildCombinedSnapshot();
      }
    }, BATCH_NOTIFY_INTERVAL_MS);
  }, [rebuildCombinedSnapshot]);

  // Gentle memory cleanup for truly stale vessels (older than 3 hours)
  const pruneStaleVessels = useCallback(() => {
    if (liveFleetMapRef.current.size > MAX_FLEET_CAPACITY) {
      const now = Date.now();
      for (const [id, ship] of liveFleetMapRef.current.entries()) {
        const updateTime = new Date(ship.lastUpdate).getTime();
        if (now - updateTime > STALE_VESSEL_TIMEOUT_MS) {
          liveFleetMapRef.current.delete(id);
        }
      }
    }
  }, []);

  // Synchronize vessels from backend REST API response
  useEffect(() => {
    if (!shipResponse?.ships || shipResponse.ships.length === 0) return;
    const backendShips = shipResponse.ships;
    const hasLiveFromBackend = backendShips.some((s) => s.is_live);

    if (hasLiveFromBackend) {
      setStreamState("connected");
      for (const item of backendShips) {
        if (item.is_live) {
          liveFleetMapRef.current.set(item.id, item);
        }
      }
      scheduleBatchedNotify();
    }
  }, [shipResponse, scheduleBatchedNotify]);

  // 1. Backend WebSocket Connection (`/api/v1/ws/live`)
  useEffect(() => {
    let isCleanedUp = false;
    let fallbackToDirect = false;

    const connectBackendWs = () => {
      try {
        const wsUrl = getWebSocketUrl();
        const ws = new WebSocket(wsUrl);
        backendWsRef.current = ws;

        ws.onopen = () => {
          if (isCleanedUp) {
            ws.close();
            return;
          }
          setStreamState("connected");
          // If we have active viewport bounds, send them immediately
          if (viewportBoundsRef.current) {
            ws.send(JSON.stringify(viewportBoundsRef.current));
          }
        };

        ws.onmessage = (e) => {
          if (isCleanedUp) return;
          try {
            const data = JSON.parse(e.data);
            if (data?.ships && Array.isArray(data.ships)) {
              messageCounterRef.current += data.ships.length;
              setLiveMessageCount(messageCounterRef.current);
              setStreamState("connected");

              for (const ship of data.ships) {
                if (ship.is_live) {
                  liveFleetMapRef.current.set(ship.id, ship);
                }
              }
              pruneStaleVessels();
              scheduleBatchedNotify();
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          fallbackToDirect = true;
        };

        ws.onclose = () => {
          if (!isCleanedUp && !fallbackToDirect) {
            setTimeout(connectBackendWs, 5000);
          }
        };
      } catch {
        fallbackToDirect = true;
      }
    };

    connectBackendWs();

    return () => {
      isCleanedUp = true;
      if (backendWsRef.current) {
        backendWsRef.current.close();
        backendWsRef.current = null;
      }
    };
  }, [pruneStaleVessels, scheduleBatchedNotify]);

  // 2. Direct Browser AISStream WebSocket Connection
  useEffect(() => {
    const aisApiKey =
      import.meta.env.VITE_AISSTREAM_API_KEY ||
      "4e9ffc8e2f1a92a58fc18d98651ad789d3a80501";

    if (!aisApiKey) return;

    let reconnectTimeout: number | null = null;
    let isCleanedUp = false;

    const connectAisStream = () => {
      if (isCleanedUp) return;

      try {
        const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
        aisWsRef.current = ws;

        ws.onopen = () => {
          if (isCleanedUp) {
            ws.close();
            return;
          }
          setStreamState("connected");

          const boundingBoxes: [[[number, number], [number, number]]] = [
            [[22.0, 48.0], [32.0, 62.0]], // Persian Gulf & Oman Sea
            [[36.0, 48.0], [42.0, 55.0]], // Caspian Sea
            [[-90.0, -180.0], [90.0, 180.0]], // Global
          ];

          if (viewportBoundsRef.current) {
            const vb = viewportBoundsRef.current;
            boundingBoxes.unshift([[vb.lamin, vb.lomin], [vb.lamax, vb.lomax]]);
          }

          const subscriptionPayload = {
            APIKey: aisApiKey,
            BoundingBoxes: boundingBoxes,
            FilterMessageTypes: [
              "PositionReport",
              "StandardClassBPositionReport",
              "ShipStaticData",
              "ExtendedClassBPositionReport",
            ],
          };
          ws.send(JSON.stringify(subscriptionPayload));
        };

        ws.onmessage = (event) => {
          if (isCleanedUp) return;
          try {
            const data = JSON.parse(event.data);
            const msgType = data.MessageType;
            if (msgType === "SubscriptionConfirmation") {
              setStreamState("connected");
              return;
            }

            messageCounterRef.current += 1;
            if (messageCounterRef.current % 10 === 0) {
              setLiveMessageCount(messageCounterRef.current);
            }

            const meta = data.MetaData || {};
            const mmsi = String(meta.MMSI || meta.MMSI_String || "").trim();
            if (!mmsi) return;

            const shipId = `SH_${mmsi}`;
            const timeUtc = meta.time_utc || new Date().toISOString();
            const shipName = (meta.ShipName || "").trim();
            const msgBody = data.Message || {};

            const existingShip = liveFleetMapRef.current.get(shipId);

            if (
              msgType === "PositionReport" ||
              msgType === "StandardClassBPositionReport" ||
              msgType === "ExtendedClassBPositionReport"
            ) {
              const posReport =
                msgBody.PositionReport ||
                msgBody.StandardClassBPositionReport ||
                msgBody.ExtendedClassBPositionReport ||
                {};

              const latRaw =
                posReport.Latitude !== undefined ? posReport.Latitude : meta.latitude;
              const lonRaw =
                posReport.Longitude !== undefined ? posReport.Longitude : meta.longitude;

              if (latRaw === undefined || lonRaw === undefined) return;
              const lat = Number(latRaw);
              const lon = Number(lonRaw);

              if (
                Math.abs(lat) > 90.0 ||
                Math.abs(lon) > 180.0 ||
                (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001)
              ) {
                return;
              }

              const speedKts = Math.max(0, Number(posReport.Sog || 0));
              const cog = posReport.Cog !== undefined ? Number(posReport.Cog) : undefined;
              const trueHdg = posReport.TrueHeading !== undefined ? Number(posReport.TrueHeading) : undefined;
              const hdg = normalizeHeading(trueHdg, cog, existingShip?.heading_deg);

              const nextPath: [number, number][] = existingShip ? [...existingShip.path] : [];
              if (
                nextPath.length === 0 ||
                Math.abs(nextPath[nextPath.length - 1][0] - lat) > 0.0001 ||
                Math.abs(nextPath[nextPath.length - 1][1] - lon) > 0.0001
              ) {
                nextPath.push([lat, lon]);
                if (nextPath.length > 50) {
                  nextPath.shift();
                }
              }

              const cleanName =
                shipName ||
                (posReport.Name ? String(posReport.Name).trim() : "") ||
                existingShip?.name ||
                `MMSI ${mmsi}`;

              const typeCode = posReport.Type || posReport.ShipType;
              const shipType = typeCode
                ? mapAisTypeToShipType(typeCode)
                : existingShip?.shipType || "cargo";

              const updatedShip: Ship = {
                id: shipId,
                name: cleanName,
                mmsi: mmsi,
                operator: existingShip?.operator || "Live AIS Vessel",
                shipType: shipType,
                lat: lat,
                lon: lon,
                heading_deg: hdg,
                speed_kts: speedKts,
                draft_m: existingShip?.draft_m || 7.0,
                length_m: existingShip?.length_m || 110.0,
                beam_m: existingShip?.beam_m || 20.0,
                callsign: existingShip?.callsign,
                imo: existingShip?.imo,
                nav_status:
                  posReport.NavigationalStatus !== undefined
                    ? String(posReport.NavigationalStatus)
                    : existingShip?.nav_status,
                origin_port: existingShip?.origin_port || "Unknown Port",
                destination_port: existingShip?.destination_port || "In Transit",
                eta: existingShip?.eta,
                country: existingShip?.country || "International",
                flag: existingShip?.flag,
                is_live: true,
                path: nextPath,
                lastUpdate: timeUtc,
              };

              liveFleetMapRef.current.set(shipId, updatedShip);
              pruneStaleVessels();
              scheduleBatchedNotify();
            } else if (msgType === "ShipStaticData") {
              const staticData = msgBody.ShipStaticData || {};
              const cleanName = (staticData.Name ? String(staticData.Name).trim() : "") || shipName;
              const callsign = staticData.CallSign ? String(staticData.CallSign).trim() : undefined;
              const imo = staticData.ImoNumber ? Number(staticData.ImoNumber) : undefined;
              const typeCode = staticData.Type;
              const shipType = typeCode ? mapAisTypeToShipType(typeCode) : undefined;
              const destination = staticData.Destination ? String(staticData.Destination).trim() : undefined;
              const draught = staticData.MaximumStaticDraught || staticData.Draught;

              let lengthM: number | undefined;
              let beamM: number | undefined;
              if (staticData.Dimension) {
                const dimA = Number(staticData.Dimension.A || 0);
                const dimB = Number(staticData.Dimension.B || 0);
                const dimC = Number(staticData.Dimension.C || 0);
                const dimD = Number(staticData.Dimension.D || 0);
                if (dimA + dimB > 0) lengthM = dimA + dimB;
                if (dimC + dimD > 0) beamM = dimC + dimD;
              }

              if (existingShip) {
                const updated: Ship = {
                  ...existingShip,
                  name: cleanName || existingShip.name,
                  callsign: callsign || existingShip.callsign,
                  imo: imo || existingShip.imo,
                  shipType: shipType || existingShip.shipType,
                  destination_port: destination || existingShip.destination_port,
                  draft_m: draught ? Number(draught) : existingShip.draft_m,
                  length_m: lengthM || existingShip.length_m,
                  beam_m: beamM || existingShip.beam_m,
                  lastUpdate: timeUtc,
                };
                liveFleetMapRef.current.set(shipId, updated);
                scheduleBatchedNotify();
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          // Keep current state
        };

        ws.onclose = () => {
          if (!isCleanedUp) {
            reconnectTimeout = window.setTimeout(connectAisStream, 4000);
          }
        };
      } catch {
        if (!isCleanedUp) {
          reconnectTimeout = window.setTimeout(connectAisStream, 6000);
        }
      }
    };

    connectAisStream();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      if (aisWsRef.current) {
        aisWsRef.current.onclose = null;
        aisWsRef.current.onerror = null;
        aisWsRef.current.close();
        aisWsRef.current = null;
      }
    };
  }, [pruneStaleVessels, scheduleBatchedNotify]);

  // Synchronize viewport bounds to fetch all vessels in the active viewing area
  const setViewportBounds = useCallback(
    (bounds: ViewportBounds) => {
      viewportBoundsRef.current = bounds;

      // 1. If backend WebSocket is connected, push bounds to receive immediate viewport batch
      if (backendWsRef.current?.readyState === WebSocket.OPEN) {
        backendWsRef.current.send(JSON.stringify(bounds));
      }

      // 2. Fetch immediate viewport snapshot from backend API
      if (viewportFetchAbortRef.current) {
        viewportFetchAbortRef.current.abort();
      }
      const abortCtrl = new AbortController();
      viewportFetchAbortRef.current = abortCtrl;

      fetchShips(bounds, abortCtrl.signal)
        .then((res) => {
          if (res?.ships && Array.isArray(res.ships)) {
            for (const item of res.ships) {
              if (item.is_live) {
                liveFleetMapRef.current.set(item.id, item);
              }
            }
            scheduleBatchedNotify();
          }
        })
        .catch(() => {
          // Ignore aborted requests
        });
    },
    [scheduleBatchedNotify]
  );

  // Simulation tick loop for baseline ships (runs at 2.5 FPS / 400ms)
  useEffect(() => {
    if (!active) return;

    let timerId: number | null = null;
    let lastTime = performance.now();
    const TICK_INTERVAL_MS = 400;
    const TIME_SCALE = 30;

    const tick = () => {
      if (!activeRef.current) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.5);
      lastTime = now;

      // Advance simulated baseline ships
      for (const [id, item] of baseFleetMapRef.current.entries()) {
        const route = routesRef.current.get(id) ?? item.path ?? [];
        if (route.length < 2) continue;

        const currentSim = simStatesRef.current.get(id) ?? initShipSim(item);
        const nextSim = advanceShipSim(
          currentSim,
          route,
          item.speed_kts,
          delta * TIME_SCALE
        );
        simStatesRef.current.set(id, nextSim);
        baseFleetMapRef.current.set(id, {
          ...item,
          lat: nextSim.lat,
          lon: nextSim.lon,
          heading_deg: nextSim.heading_deg,
        });
      }

      scheduleBatchedNotify();
      timerId = window.setTimeout(tick, TICK_INTERVAL_MS);
    };

    timerId = window.setTimeout(tick, TICK_INTERVAL_MS);

    return () => {
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [active, scheduleBatchedNotify]);

  const getShipById = useCallback(
    (id: string) => {
      const live = liveFleetMapRef.current.get(id);
      if (live) return live;
      const base = baseFleetMapRef.current.get(id);
      if (base) return base;
      return shipsRef.current.find((item) => item.id === id || item.mmsi === id) || null;
    },
    []
  );

  const getWakePath = useCallback((id: string): WakePoint[] => {
    const live = liveFleetMapRef.current.get(id);
    if (live) {
      return (live.path as WakePoint[]) || [];
    }

    const base = baseFleetMapRef.current.get(id);
    if (!base) return [];

    const sim = simStatesRef.current.get(id);
    return buildWakePath(base, sim);
  }, []);

  const getVoyage = useCallback((id: string): VoyageProgress | null => {
    const base = baseFleetMapRef.current.get(id);
    if (!base) return null;
    return getVoyageProgress(base, simStatesRef.current.get(id));
  }, []);

  const isLiveStream = streamState === "connected" || liveFleetMapRef.current.size > 0;

  const value = useMemo(
    () => ({
      getShipById,
      getWakePath,
      getVoyage,
      subscribe,
      getSnapshot,
      isLoadingBackendShips,
      streamState,
      liveMessageCount,
      isLiveStream,
      setViewportBounds,
    }),
    [
      getShipById,
      getWakePath,
      getVoyage,
      subscribe,
      getSnapshot,
      isLoadingBackendShips,
      streamState,
      liveMessageCount,
      isLiveStream,
      setViewportBounds,
    ]
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
