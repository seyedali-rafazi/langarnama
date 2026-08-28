import type { ShipFilterParams } from "./api";

export const queryKeys = {
  ships: {
    all: ["ships"] as const,
    list: (params?: ShipFilterParams) => ["ships", "list", params ?? {}] as const,
    detail: (shipId: string) => ["ships", "detail", shipId] as const,
    track: (shipId: string) => ["ships", "track", shipId] as const,
    streamStatus: () => ["ships", "stream", "status"] as const,
  },
  ports: {
    all: ["ports"] as const,
    list: () => ["ports", "list"] as const,
    detail: (codeOrId: string) => ["ports", "detail", codeOrId] as const,
  },
  stations: {
    all: ["stations"] as const,
    list: () => ["stations", "list"] as const,
    detail: (stationId: string) => ["stations", "detail", stationId] as const,
  },
  stats: {
    all: ["stats"] as const,
    summary: () => ["stats", "summary"] as const,
  },
};
