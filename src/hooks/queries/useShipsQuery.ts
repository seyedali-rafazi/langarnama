import { useQuery } from "@tanstack/react-query";
import {
  fetchShipDetail,
  fetchShips,
  fetchShipTrack,
  fetchStreamStatus,
  type ShipDetail,
  type ShipFilterParams,
  type ShipListResponse,
  type ShipTrackResponse,
  type StreamStatusResponse,
} from "../../services/api";
import { queryKeys } from "../../services/queryKeys";
import { BASE_SHIPS } from "../../pages/Home/components/ShipLayer/data/shipFleet";
import type { Ship } from "../../pages/Home/components/ShipLayer/types/Ship";

export const BASELINE_SHIP_RESPONSE: ShipListResponse = {
  total: BASE_SHIPS.length,
  count: BASE_SHIPS.length,
  time: Math.floor(Date.now() / 1000),
  ships: BASE_SHIPS,
  live_stream_connected: false,
  cached: true,
};

/**
 * React Query hook to fetch vessels matching spatial and attribute filters.
 */
export function useShipsQuery(params?: ShipFilterParams) {
  return useQuery<ShipListResponse>({
    queryKey: queryKeys.ships.list(params),
    queryFn: ({ signal }) => fetchShips(params, signal),
    placeholderData: !params || Object.keys(params).length === 0 ? BASELINE_SHIP_RESPONSE : undefined,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * React Query hook to fetch vessel detail by ID or MMSI.
 */
export function useShipDetailQuery(shipId?: string | null) {
  const fallbackShip = BASE_SHIPS.find((s) => s.id === shipId || s.mmsi === shipId) as
    | ShipDetail
    | undefined;

  return useQuery<ShipDetail>({
    queryKey: queryKeys.ships.detail(shipId || ""),
    queryFn: ({ signal }) => fetchShipDetail(shipId!, signal),
    enabled: Boolean(shipId),
    placeholderData: fallbackShip,
    staleTime: 15_000,
  });
}

/**
 * React Query hook to fetch historical route track coordinates for a vessel.
 */
export function useShipTrackQuery(shipId?: string | null) {
  const fallbackShip: Ship | undefined = BASE_SHIPS.find(
    (s) => s.id === shipId || s.mmsi === shipId
  );

  const fallbackTrack: ShipTrackResponse | undefined = fallbackShip
    ? {
        ship_id: fallbackShip.id,
        mmsi: fallbackShip.mmsi,
        name: fallbackShip.name,
        shipType: fallbackShip.shipType,
        points: (fallbackShip.path as [number, number][]) || [],
        count: fallbackShip.path?.length || 0,
        last_update: fallbackShip.lastUpdate,
      }
    : undefined;

  return useQuery<ShipTrackResponse>({
    queryKey: queryKeys.ships.track(shipId || ""),
    queryFn: ({ signal }) => fetchShipTrack(shipId!, signal),
    enabled: Boolean(shipId),
    placeholderData: fallbackTrack,
    staleTime: 30_000,
  });
}

/**
 * React Query hook to fetch real-time AISStream WebSocket connection health.
 */
export function useStreamStatusQuery(refetchInterval: number = 8_000) {
  return useQuery<StreamStatusResponse>({
    queryKey: queryKeys.ships.streamStatus(),
    queryFn: ({ signal }) => fetchStreamStatus(signal),
    refetchInterval,
    staleTime: 5_000,
  });
}
