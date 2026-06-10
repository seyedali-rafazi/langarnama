export interface Port {
  id: string;
  name: string;
  /** UN/LOCODE, e.g. IRBND. */
  locode: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  berths: number;
  maxDraft_m: number;
}
