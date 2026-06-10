import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface DrawnWake {
  shipId: string;
  visible: boolean;
}

interface ShipContextValue {
  wakes: DrawnWake[];
  addWake: (shipId: string) => void;
  removeWake: (shipId: string) => void;
  toggleWakeVisibility: (shipId: string) => void;
  hasWake: (shipId: string) => boolean;
  isWakeVisible: (shipId: string) => boolean;
}

const ShipContext = createContext<ShipContextValue | null>(null);

export function ShipProvider({ children }: { children: ReactNode }) {
  const [wakes, setWakes] = useState<DrawnWake[]>([]);

  const addWake = useCallback((shipId: string) => {
    setWakes((prev) => {
      if (prev.some((w) => w.shipId === shipId)) return prev;
      return [...prev, { shipId, visible: true }];
    });
  }, []);

  const removeWake = useCallback((shipId: string) => {
    setWakes((prev) => prev.filter((w) => w.shipId !== shipId));
  }, []);

  const toggleWakeVisibility = useCallback((shipId: string) => {
    setWakes((prev) =>
      prev.map((w) =>
        w.shipId === shipId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  const hasWake = useCallback(
    (shipId: string) => wakes.some((w) => w.shipId === shipId),
    [wakes]
  );

  const isWakeVisible = useCallback(
    (shipId: string) => wakes.some((w) => w.shipId === shipId && w.visible),
    [wakes]
  );

  const value = useMemo(
    () => ({
      wakes,
      addWake,
      removeWake,
      toggleWakeVisibility,
      hasWake,
      isWakeVisible,
    }),
    [wakes, addWake, removeWake, toggleWakeVisibility, hasWake, isWakeVisible]
  );

  return <ShipContext.Provider value={value}>{children}</ShipContext.Provider>;
}

export function useShips() {
  const context = useContext(ShipContext);
  if (!context) {
    throw new Error("useShips must be used within a ShipProvider");
  }
  return context;
}
