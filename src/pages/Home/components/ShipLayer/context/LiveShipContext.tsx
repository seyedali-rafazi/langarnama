import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export { BASE_SHIPS } from "../data/shipFleet";

type WakePoint = [number, number];
type Listener = () => void;

interface LiveShipContextValue {
  getShipById: (id: string) => Ship | null;
  getWakePath: (id: string) => WakePoint[];
  getVoyage: (id: string) => VoyageProgress | null;
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => Ship[];
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

  // Mirror `active` into a ref synchronously during render so the rAF loop can
  // halt immediately when we navigate away. Relying on effect cleanup is not
  // enough: the high-frequency store notifications can starve React's render of
  // the next page, which prevents the cleanup effect from ever running.
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

  useEffect(() => {
    if (!active) return;

    let frameId = 0;
    let lastTime = performance.now();
    let renderAccumulator = 0;
    const renderInterval = 1 / 20;
    // Ships crawl at 5-25 kts; speed up the clock so movement stays perceptible.
    const TIME_SCALE = 30;

    const tick = (now: number) => {
      // Halt immediately the moment we leave home, before doing any work or
      // notifying subscribers, so navigation renders are never starved.
      if (!activeRef.current) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      renderAccumulator += delta;

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
    (id: string) => shipsRef.current.find((item) => item.id === id) ?? null,
    []
  );

  const getWakePath = useCallback((id: string): WakePoint[] => {
    const item = BASE_SHIPS.find((s) => s.id === id);
    if (!item) return [];

    const sim = simStatesRef.current.get(id);
    const live = shipsRef.current.find((s) => s.id === id);
    const merged = live ? { ...item, ...live } : item;
    return buildWakePath(merged, sim);
  }, []);

  const getVoyage = useCallback((id: string): VoyageProgress | null => {
    const item = BASE_SHIPS.find((s) => s.id === id);
    if (!item) return null;
    return getVoyageProgress(item, simStatesRef.current.get(id));
  }, []);

  const value = useMemo(
    () => ({
      getShipById,
      getWakePath,
      getVoyage,
      subscribe,
      getSnapshot,
    }),
    [getShipById, getWakePath, getVoyage, subscribe, getSnapshot]
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
