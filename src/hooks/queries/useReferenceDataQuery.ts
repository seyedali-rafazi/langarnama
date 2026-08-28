import { useQuery } from "@tanstack/react-query";
import portData from "../../pages/Home/components/PortLayer/data/iran_ports.json";
import stationData from "../../pages/Home/components/StationLayer/data/iran_coastal_stations.json";
import type { Port } from "../../pages/Home/components/PortLayer/types/Port";
import type { CoastalStation } from "../../pages/Home/components/StationLayer/types/CoastalStation";
import {
  fetchPortDetail,
  fetchPorts,
  fetchStationDetail,
  fetchStations,
  type PortListResponse,
  type StationListResponse,
} from "../../services/api";
import { queryKeys } from "../../services/queryKeys";

export const BASE_PORTS = portData as Port[];
export const BASE_STATIONS = stationData as CoastalStation[];

export const BASELINE_PORTS_RESPONSE: PortListResponse = {
  total: BASE_PORTS.length,
  ports: BASE_PORTS,
};

export const BASELINE_STATIONS_RESPONSE: StationListResponse = {
  total: BASE_STATIONS.length,
  stations: BASE_STATIONS,
};

/**
 * React Query hook to fetch maritime ports with long-lived reference caching.
 */
export function usePortsQuery() {
  return useQuery<PortListResponse>({
    queryKey: queryKeys.ports.list(),
    queryFn: ({ signal }) => fetchPorts(signal),
    placeholderData: BASELINE_PORTS_RESPONSE,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * React Query hook to fetch port detail by ID or UN/LOCODE.
 */
export function usePortDetailQuery(codeOrId?: string | null) {
  const fallback = BASE_PORTS.find(
    (p) => p.id === codeOrId || p.locode.toLowerCase() === (codeOrId || "").toLowerCase()
  );

  return useQuery<Port>({
    queryKey: queryKeys.ports.detail(codeOrId || ""),
    queryFn: ({ signal }) => fetchPortDetail(codeOrId!, signal),
    enabled: Boolean(codeOrId),
    placeholderData: fallback,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch coastal stations (VTS, AIS receivers, lighthouses).
 */
export function useStationsQuery() {
  return useQuery<StationListResponse>({
    queryKey: queryKeys.stations.list(),
    queryFn: ({ signal }) => fetchStations(signal),
    placeholderData: BASELINE_STATIONS_RESPONSE,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch coastal station detail by ID.
 */
export function useStationDetailQuery(stationId?: string | null) {
  const fallback = BASE_STATIONS.find((s) => s.id === stationId);

  return useQuery<CoastalStation>({
    queryKey: queryKeys.stations.detail(stationId || ""),
    queryFn: ({ signal }) => fetchStationDetail(stationId!, signal),
    enabled: Boolean(stationId),
    placeholderData: fallback,
    staleTime: 10 * 60 * 1000,
  });
}
