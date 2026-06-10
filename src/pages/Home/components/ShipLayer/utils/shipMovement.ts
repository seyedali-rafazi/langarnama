import type { Ship } from "../types/Ship";

export interface ShipSimState {
  lat: number;
  lon: number;
  heading_deg: number;
  segmentIndex: number;
  progress: number;
}

const EARTH_RADIUS_NM = 3440.065;

export function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

export function bearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1r = toRad(lat1);
  const lat2r = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(lat2r);
  const x =
    Math.cos(lat1r) * Math.sin(lat2r) -
    Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function interpolateLatLon(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  t: number
): { lat: number; lon: number } {
  return {
    lat: lat1 + (lat2 - lat1) * t,
    lon: lon1 + (lon2 - lon1) * t,
  };
}

function projectOnSegment(
  lat: number,
  lon: number,
  start: [number, number],
  end: [number, number]
): { lat: number; lon: number; t: number } {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { lat: lat1, lon: lon1, t: 0 };
  }

  const t = Math.max(
    0,
    Math.min(1, ((lon - lon1) * dx + (lat - lat1) * dy) / lenSq)
  );
  const point = interpolateLatLon(lat1, lon1, lat2, lon2, t);
  return { ...point, t };
}

export function initShipSim(ship: Ship): ShipSimState {
  const route = ship.path;
  if (route.length < 2) {
    return {
      lat: ship.lat,
      lon: ship.lon,
      heading_deg: ship.heading_deg,
      segmentIndex: 0,
      progress: 0,
    };
  }

  let bestDist = Infinity;
  let bestSeg = 0;
  let bestProgress = 0;
  let bestLat = ship.lat;
  let bestLon = ship.lon;

  for (let i = 0; i < route.length - 1; i++) {
    const projected = projectOnSegment(ship.lat, ship.lon, route[i], route[i + 1]);
    const dist = haversineNm(ship.lat, ship.lon, projected.lat, projected.lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestSeg = i;
      bestProgress = projected.t;
      bestLat = projected.lat;
      bestLon = projected.lon;
    }
  }

  const next = route[Math.min(bestSeg + 1, route.length - 1)];
  return {
    lat: bestLat,
    lon: bestLon,
    heading_deg: formatHeading(bearingDeg(bestLat, bestLon, next[0], next[1])),
    segmentIndex: bestSeg,
    progress: bestProgress,
  };
}

export function advanceShipSim(
  state: ShipSimState,
  route: [number, number][],
  speedKts: number,
  deltaSeconds: number
): ShipSimState {
  if (route.length < 2) {
    return state;
  }

  let distanceNm = (speedKts / 3600) * deltaSeconds;
  let { lat, lon, segmentIndex, progress } = state;

  while (distanceNm > 0 && segmentIndex < route.length - 1) {
    const [lat1, lon1] = route[segmentIndex];
    const [lat2, lon2] = route[segmentIndex + 1];
    const segLen = haversineNm(lat1, lon1, lat2, lon2);

    if (segLen === 0) {
      segmentIndex++;
      progress = 0;
      continue;
    }

    const remainingOnSeg = segLen * (1 - progress);

    if (distanceNm >= remainingOnSeg) {
      distanceNm -= remainingOnSeg;
      lat = lat2;
      lon = lon2;
      segmentIndex++;
      progress = 0;

      if (segmentIndex >= route.length - 1) {
        break;
      }
    } else {
      progress += distanceNm / segLen;
      const next = interpolateLatLon(lat1, lon1, lat2, lon2, progress);
      lat = next.lat;
      lon = next.lon;
      distanceNm = 0;
    }
  }

  const nextIdx = Math.min(segmentIndex + 1, route.length - 1);
  const heading = bearingDeg(lat, lon, route[nextIdx][0], route[nextIdx][1]);

  return {
    lat,
    lon,
    heading_deg: Math.round(heading) % 360,
    segmentIndex: Math.min(segmentIndex, route.length - 2),
    progress,
  };
}

export function formatHeading(heading: number): number {
  return Math.round(heading) % 360;
}

/** Build wake polyline in [lon, lat] order, from route start to the ship. */
export function buildWakePath(
  ship: Ship,
  sim?: ShipSimState
): [number, number][] {
  const route = ship.path;
  if (route.length === 0) {
    return [[ship.lon, ship.lat]];
  }

  const position = sim ?? {
    lat: ship.lat,
    lon: ship.lon,
    segmentIndex: route.length - 2,
    progress: 1,
    heading_deg: ship.heading_deg,
  };

  const wake: [number, number][] = [[route[0][1], route[0][0]]];

  for (let i = 0; i < position.segmentIndex; i++) {
    wake.push([route[i + 1][1], route[i + 1][0]]);
  }

  wake.push([position.lon, position.lat]);
  return wake;
}

export interface VoyageProgress {
  totalNm: number;
  traveledNm: number;
  remainingNm: number;
  /** Estimated minutes until the last waypoint at current speed, or null when idle. */
  etaMinutes: number | null;
}

/** Distance accounting along the route — powers the ETA readout in ship popups. */
export function getVoyageProgress(ship: Ship, sim?: ShipSimState): VoyageProgress {
  const route = ship.path;
  if (route.length < 2) {
    return { totalNm: 0, traveledNm: 0, remainingNm: 0, etaMinutes: null };
  }

  const position = sim ?? initShipSim(ship);
  let totalNm = 0;
  let traveledNm = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const segLen = haversineNm(
      route[i][0],
      route[i][1],
      route[i + 1][0],
      route[i + 1][1]
    );
    totalNm += segLen;
    if (i < position.segmentIndex) {
      traveledNm += segLen;
    } else if (i === position.segmentIndex) {
      traveledNm += segLen * position.progress;
    }
  }

  const remainingNm = Math.max(0, totalNm - traveledNm);
  const etaMinutes =
    ship.speed_kts > 0 && remainingNm > 0.05
      ? (remainingNm / ship.speed_kts) * 60
      : null;

  return { totalNm, traveledNm, remainingNm, etaMinutes };
}
