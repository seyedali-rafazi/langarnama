export type ShipType =
  | "tanker"
  | "cargo"
  | "fishing"
  | "passenger"
  | "tug"
  | "military";

export interface Ship {
  id: string;
  name: string;
  mmsi: string;
  operator: string;
  shipType: ShipType;
  lat: number;
  lon: number;
  heading_deg: number;
  speed_kts: number;
  draft_m: number;
  length_m: number;
  origin_port: string;
  destination_port: string;
  /** Route waypoints in [lat, lon] order. */
  path: [number, number][];
  lastUpdate: string;
}

export interface ShipTypeConfig {
  label: string;
  shortLabel: string;
  /** Hex color used in UI chrome (legend, chips, cards). */
  color: string;
  /** Same color as RGB triplet for deck.gl layers. */
  colorRgb: [number, number, number];
  description: string;
}

export const SHIP_TYPE_CONFIG: Record<ShipType, ShipTypeConfig> = {
  tanker: {
    label: "Oil Tanker",
    shortLabel: "Tanker",
    color: "#ef4444",
    colorRgb: [239, 68, 68],
    description: "Crude and product tankers",
  },
  cargo: {
    label: "Cargo / Container",
    shortLabel: "Cargo",
    color: "#f97316",
    colorRgb: [249, 115, 22],
    description: "General cargo and container ships",
  },
  fishing: {
    label: "Fishing Vessel",
    shortLabel: "Fishing",
    color: "#22c55e",
    colorRgb: [34, 197, 94],
    description: "Trawlers and fishing dhows",
  },
  passenger: {
    label: "Passenger / Ferry",
    shortLabel: "Ferry",
    color: "#3b82f6",
    colorRgb: [59, 130, 246],
    description: "Ferries and passenger ships",
  },
  tug: {
    label: "Tug / Support",
    shortLabel: "Tug",
    color: "#facc15",
    colorRgb: [250, 204, 21],
    description: "Harbor tugs and service craft",
  },
  military: {
    label: "Naval / Patrol",
    shortLabel: "Naval",
    color: "#94a3b8",
    colorRgb: [148, 163, 184],
    description: "Navy and coast guard vessels",
  },
};

export const SHIP_TYPES = Object.keys(SHIP_TYPE_CONFIG) as ShipType[];

export function getShipTypeConfig(type: string): ShipTypeConfig {
  return SHIP_TYPE_CONFIG[type as ShipType] ?? SHIP_TYPE_CONFIG.cargo;
}
