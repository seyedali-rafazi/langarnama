import type { Ship, ShipType } from "../pages/Home/components/ShipLayer/types/Ship";
import type { Port } from "../pages/Home/components/PortLayer/types/Port";
import type { CoastalStation } from "../pages/Home/components/StationLayer/types/CoastalStation";

export interface ShipFilterParams {
  lamin?: number;
  lomin?: number;
  lamax?: number;
  lomax?: number;
  search?: string;
  ship_type?: ShipType | string;
  operator?: string;
  min_speed?: number;
  max_speed?: number;
  only_live?: boolean;
}

export interface ShipDetail extends Ship {
  rot?: number | null;
  cog?: number | null;
  sog?: number | null;
  dimension_a?: number | null;
  dimension_b?: number | null;
  dimension_c?: number | null;
  dimension_d?: number | null;
  is_live?: boolean;
}

export interface ShipListResponse {
  total: number;
  count: number;
  time: number;
  ships: Ship[];
  live_stream_connected: boolean;
  cached: boolean;
}

export interface ShipTrackResponse {
  ship_id: string;
  mmsi: string;
  name: string;
  shipType: string;
  points: [number, number][];
  count: number;
  last_update: string;
}

export interface StreamStatusResponse {
  running: boolean;
  connected: boolean;
  api_key_configured: boolean;
  stream_url?: string;
  messages_received: number;
  total_cached_vessels: number;
  last_connected_epoch?: number;
  last_error?: string;
}

export interface PortListResponse {
  total: number;
  ports: Port[];
}

export interface StationListResponse {
  total: number;
  stations: CoastalStation[];
}

export interface StatsResponse {
  total_ships: number;
  active_underway: number;
  anchored_moored: number;
  avg_speed_kts: number;
  by_type: Record<string, number>;
  total_ports: number;
  total_stations: number;
  aisstream_connected: boolean;
  messages_received: number;
  last_message_time?: string | null;
  uptime_seconds: number;
}

/**
 * Resolves full API URL based on VITE_API_BASE_URL (supports absolute and relative URLs).
 */
export function getApiUrl(endpointPath: string): string {
  const rawBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  if (rawBase.startsWith("http://") || rawBase.startsWith("https://")) {
    const trimmedBase = rawBase.replace(/\/$/, "");
    return `${trimmedBase}${normalizedPath}`;
  }

  const trimmedBase = rawBase.startsWith("/") ? rawBase.replace(/\/$/, "") : `/${rawBase.replace(/\/$/, "")}`;
  return `${window.location.origin}${trimmedBase}${normalizedPath}`;
}

/**
 * Helper to execute JSON HTTP requests with error parsing and Vercel 304 / caching prevention.
 */
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });

  if (response.status === 304) {
    return {} as T;
  }

  if (!response.ok) {
    let errorText = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.detail) {
        errorText = typeof errBody.detail === "string" ? errBody.detail : JSON.stringify(errBody.detail);
      }
    } catch {
      // Use statusText
    }
    throw new Error(`API Error [${response.status}]: ${errorText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text || text.trim() === "") {
    return {} as T;
  }

  // Detect when Vercel rewrites a missing backend /api route to index.html
  if (text.trim().startsWith("<") || contentType.includes("text/html")) {
    throw new Error(`API returned HTML instead of JSON for ${url} (backend not deployed on this domain)`);
  }

  return JSON.parse(text);
}

export async function fetchShips(
  params?: ShipFilterParams,
  signal?: AbortSignal
): Promise<ShipListResponse> {
  const fullUrl = new URL(getApiUrl("/ships"));
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        fullUrl.searchParams.append(key, String(val));
      }
    });
  }
  return fetchJson<ShipListResponse>(fullUrl.toString(), signal);
}

export async function fetchShipDetail(
  shipId: string,
  signal?: AbortSignal
): Promise<ShipDetail> {
  const url = getApiUrl(`/ships/${encodeURIComponent(shipId)}`);
  return fetchJson<ShipDetail>(url, signal);
}

export async function fetchShipTrack(
  shipId: string,
  signal?: AbortSignal
): Promise<ShipTrackResponse> {
  const url = getApiUrl(`/ships/${encodeURIComponent(shipId)}/track`);
  return fetchJson<ShipTrackResponse>(url, signal);
}

export async function fetchStreamStatus(
  signal?: AbortSignal
): Promise<StreamStatusResponse> {
  const url = getApiUrl("/ships/stream/status");
  return fetchJson<StreamStatusResponse>(url, signal);
}

export async function fetchPorts(signal?: AbortSignal): Promise<PortListResponse> {
  const url = getApiUrl("/ports");
  return fetchJson<PortListResponse>(url, signal);
}

export async function fetchPortDetail(
  codeOrId: string,
  signal?: AbortSignal
): Promise<Port> {
  const url = getApiUrl(`/ports/${encodeURIComponent(codeOrId)}`);
  return fetchJson<Port>(url, signal);
}

export async function fetchStations(
  signal?: AbortSignal
): Promise<StationListResponse> {
  const url = getApiUrl("/stations");
  return fetchJson<StationListResponse>(url, signal);
}

export async function fetchStationDetail(
  stationId: string,
  signal?: AbortSignal
): Promise<CoastalStation> {
  const url = getApiUrl(`/stations/${encodeURIComponent(stationId)}`);
  return fetchJson<CoastalStation>(url, signal);
}

export async function fetchStats(signal?: AbortSignal): Promise<StatsResponse> {
  const url = getApiUrl("/stats");
  return fetchJson<StatsResponse>(url, signal);
}

export function getWebSocketUrl(filters?: Record<string, string | number | undefined>): string {
  const customWs = import.meta.env.VITE_WS_URL;
  let baseWs: string;

  if (customWs) {
    baseWs = customWs;
  } else {
    const rawBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    if (rawBase.startsWith("https://")) {
      baseWs = rawBase.replace(/^https:\/\//, "wss://") + "/ws/live";
    } else if (rawBase.startsWith("http://")) {
      baseWs = rawBase.replace(/^http:\/\//, "ws://") + "/ws/live";
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      baseWs = `${protocol}//${window.location.host}${rawBase}/ws/live`;
    }
  }

  const url = new URL(baseWs);
  if (filters) {
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.append(key, String(val));
      }
    });
  }
  return url.toString();
}
