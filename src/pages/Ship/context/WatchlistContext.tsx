import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

const STORAGE_KEY = "langarnama:tracked-fleet";

interface WatchlistContextValue {
  trackedIds: string[];
  trackedCount: number;
  isTracked: (shipId: string) => boolean;
  toggleTracked: (shipId: string, shipName?: string) => void;
  clearTracked: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function readStoredIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [trackedIds, setTrackedIds] = useState<string[]>(readStoredIds);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedIds));
    } catch {
      // storage may be unavailable (private mode) — tracking stays in-memory
    }
  }, [trackedIds]);

  const isTracked = useCallback(
    (shipId: string) => trackedIds.includes(shipId),
    [trackedIds]
  );

  const toggleTracked = useCallback((shipId: string, shipName?: string) => {
    setTrackedIds((prev) => {
      const label = shipName ?? shipId;
      if (prev.includes(shipId)) {
        toast(`${label} removed from tracked fleet`, { duration: 2200 });
        return prev.filter((id) => id !== shipId);
      }
      toast.success(`${label} added to tracked fleet`, { duration: 2200 });
      return [...prev, shipId];
    });
  }, []);

  const clearTracked = useCallback(() => {
    setTrackedIds([]);
    toast("Tracked fleet cleared", { duration: 2200 });
  }, []);

  const value = useMemo(
    () => ({
      trackedIds,
      trackedCount: trackedIds.length,
      isTracked,
      toggleTracked,
      clearTracked,
    }),
    [trackedIds, isTracked, toggleTracked, clearTracked]
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return ctx;
}
