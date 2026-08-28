import { useQuery } from "@tanstack/react-query";
import { fetchStats, type StatsResponse } from "../../services/api";
import { queryKeys } from "../../services/queryKeys";
import { BASE_SHIPS } from "../../pages/Home/components/ShipLayer/data/shipFleet";
import portData from "../../pages/Home/components/PortLayer/data/iran_ports.json";
import stationData from "../../pages/Home/components/StationLayer/data/iran_coastal_stations.json";

function buildBaselineStats(): StatsResponse {
  const underway = BASE_SHIPS.filter((s) => s.speed_kts >= 0.5).length;
  const anchored = BASE_SHIPS.length - underway;
  const avgSpeed =
    BASE_SHIPS.length > 0
      ? Math.round((BASE_SHIPS.reduce((a, b) => a + b.speed_kts, 0) / BASE_SHIPS.length) * 10) / 10
      : 0;

  const byType: Record<string, number> = {};
  BASE_SHIPS.forEach((s) => {
    byType[s.shipType] = (byType[s.shipType] || 0) + 1;
  });

  return {
    total_ships: BASE_SHIPS.length,
    active_underway: underway,
    anchored_moored: anchored,
    avg_speed_kts: avgSpeed,
    by_type: byType,
    total_ports: portData.length,
    total_stations: stationData.length,
    aisstream_connected: false,
    messages_received: 0,
    last_message_time: new Date().toISOString(),
    uptime_seconds: 0,
  };
}

export const BASELINE_STATS = buildBaselineStats();

/**
 * React Query hook to fetch telemetry stats summary with automatic polling.
 */
export function useStatsQuery(refetchInterval: number = 8_000) {
  return useQuery<StatsResponse>({
    queryKey: queryKeys.stats.summary(),
    queryFn: ({ signal }) => fetchStats(signal),
    placeholderData: BASELINE_STATS,
    refetchInterval,
    staleTime: 5_000,
  });
}
