import type { Ship } from "../../Home/components/ShipLayer/types/Ship";

export type SortField =
  | "name"
  | "operator"
  | "speed"
  | "length"
  | "lastUpdate";

export type SortDirection = "asc" | "desc";

export interface ShipFilters {
  search: string;
  operator: string;
  shipType: string;
  minSpeed: number;
  maxSpeed: number;
}

export const MAX_SPEED_KTS = 35;

export const DEFAULT_FILTERS: ShipFilters = {
  search: "",
  operator: "all",
  shipType: "all",
  minSpeed: 0,
  maxSpeed: MAX_SPEED_KTS,
};

export function getUniqueOperators(ships: Ship[]): string[] {
  return [...new Set(ships.map((s) => s.operator))].sort();
}

export function getUniqueTypes(ships: Ship[]): string[] {
  return [...new Set(ships.map((s) => s.shipType))].sort();
}

export function filterShips(ships: Ship[], filters: ShipFilters): Ship[] {
  const query = filters.search.trim().toLowerCase();

  return ships.filter((s) => {
    if (filters.operator !== "all" && s.operator !== filters.operator) {
      return false;
    }
    if (filters.shipType !== "all" && s.shipType !== filters.shipType) {
      return false;
    }
    if (s.speed_kts < filters.minSpeed || s.speed_kts > filters.maxSpeed) {
      return false;
    }
    if (!query) return true;

    return (
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.mmsi.includes(query) ||
      s.operator.toLowerCase().includes(query) ||
      s.shipType.toLowerCase().includes(query) ||
      s.origin_port.toLowerCase().includes(query) ||
      s.destination_port.toLowerCase().includes(query)
    );
  });
}

export function sortShips(
  ships: Ship[],
  field: SortField,
  direction: SortDirection
): Ship[] {
  const sorted = [...ships].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "operator":
        cmp = a.operator.localeCompare(b.operator);
        break;
      case "speed":
        cmp = a.speed_kts - b.speed_kts;
        break;
      case "length":
        cmp = a.length_m - b.length_m;
        break;
      case "lastUpdate":
        cmp = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}
