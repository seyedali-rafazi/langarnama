export interface CoastalStation {
  id: string;
  name: string;
  type: "VTS" | "AIS Base" | "Lighthouse" | "Coastal Radar";
  lat: number;
  lon: number;
  frequency: string;
  range_nm: number;
  operator: string;
  status: "active" | "inactive";
}
