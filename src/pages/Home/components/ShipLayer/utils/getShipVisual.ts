import { SHIP_TYPE_CONFIG, type ShipType } from "../types/Ship";

export interface ShipVisual {
  gradient: string;
  accent: string;
}

const TYPE_VISUALS: Record<ShipType, ShipVisual> = {
  tanker: {
    gradient: "linear-gradient(135deg, #3b1212 0%, #7f1d1d 58%, #b91c1c 100%)",
    accent: SHIP_TYPE_CONFIG.tanker.color,
  },
  cargo: {
    gradient: "linear-gradient(135deg, #3a1d08 0%, #9a3412 58%, #ea580c 100%)",
    accent: SHIP_TYPE_CONFIG.cargo.color,
  },
  fishing: {
    gradient: "linear-gradient(135deg, #0c2a18 0%, #166534 58%, #16a34a 100%)",
    accent: SHIP_TYPE_CONFIG.fishing.color,
  },
  passenger: {
    gradient: "linear-gradient(135deg, #101d3b 0%, #1e40af 58%, #2563eb 100%)",
    accent: SHIP_TYPE_CONFIG.passenger.color,
  },
  tug: {
    gradient: "linear-gradient(135deg, #332708 0%, #854d0e 58%, #ca8a04 100%)",
    accent: SHIP_TYPE_CONFIG.tug.color,
  },
  military: {
    gradient: "linear-gradient(135deg, #161b22 0%, #334155 58%, #64748b 100%)",
    accent: SHIP_TYPE_CONFIG.military.color,
  },
};

export function getShipVisual(shipType: string): ShipVisual {
  return TYPE_VISUALS[shipType as ShipType] ?? TYPE_VISUALS.cargo;
}
