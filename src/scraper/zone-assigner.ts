import type { Zone } from "./types";

// Tijuana zones with their approximate bounding boxes for fast lookup
// Format: [minLat, maxLat, minLng, maxLng]
type BoundingBox = [number, number, number, number];

const ZONE_BBOXES: Record<string, BoundingBox> = {
  "zona-rio": [32.505, 32.530, -117.045, -117.025],
  "playas-de-tijuana": [32.510, 32.540, -117.140, -117.100],
  otay: [32.520, 32.550, -116.985, -116.950],
  chapultepec: [32.510, 32.530, -117.005, -116.978],
  hipodromo: [32.495, 32.515, -117.010, -116.985],
  centro: [32.525, 32.545, -117.045, -117.025],
  "residencial-del-bosque": [32.488, 32.508, -117.015, -116.990],
  "la-mesa": [32.515, 32.535, -116.975, -116.950],
  "santa-fe": [32.425, 32.455, -117.075, -117.040],
  "san-antonio-del-mar": [32.425, 32.460, -117.100, -117.080],
  "el-florido": [32.370, 32.470, -116.920, -116.810],
  "terrazas-de-la-presa": [32.415, 32.455, -116.930, -116.840],
};

// Common colonia names in Tijuana that help match to zones
const COLONIA_KEYWORDS: Record<string, string[]> = {
  "zona-rio": ["zona rio", "zona río", "rio tijuana", "río tijuana", "av reforma", "paseo de los héroes"],
  "playas-de-tijuana": ["playas", "playas de tijuana", "el descanso", "club hipico"],
  otay: ["otay", "mesa de otay", "granjas familiares", "los laureles"],
  chapultepec: ["chapultepec", "lomas chapultepec", "fracc chapultepec"],
  hipodromo: ["hipódromo", "hipodromo", "el maestro", "postal"],
  centro: ["centro", "zona centro", "calle segunda", "calle primera"],
  "residencial-del-bosque": ["bosque", "colinas del bosque", "loma dorada"],
  "la-mesa": ["la mesa", "mesa redonda", "villa del campo", "otay vista"],
  "santa-fe": ["santa fe", "quinta del cedro", "urbi quinta", "valparaiso residencial", "valparaíso residencial", "porticos de san antonio", "la escondida", "tossa residencial"],
  "san-antonio-del-mar": ["san antonio del mar", "real del mar", "punta bandera", "sueños del mar", "baja malibu", "baja malibú"],
  "el-florido": ["florido", "el florido", "natura", "el refugio", "villa fontana", "francisco villa"],
  "terrazas-de-la-presa": ["terrazas de la presa", "lomas de la presa", "el carrizo", "valle bonito"],
};

/** Point-in-bounding-box check */
function isInBoundingBox(lat: number, lng: number, bbox: BoundingBox): boolean {
  const [minLat, maxLat, minLng, maxLng] = bbox;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/** Calculate distance between two lat/lng points (Haversine) */
function haversineDistKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest zone by distance to zone center */
function nearestZone(lat: number, lng: number, zones: Zone[]): Zone | null {
  if (!zones.length) return null;
  let minDist = Infinity;
  let nearest: Zone | null = null;
  for (const zone of zones) {
    const dist = haversineDistKm(lat, lng, zone.lat, zone.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = zone;
    }
  }
  // Only assign if within 8km (max reasonable distance for Tijuana zones)
  return minDist <= 8 ? nearest : null;
}

/** Keyword-based fallback matching using address/title text */
function matchByKeyword(text: string, zones: Zone[]): Zone | null {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [slug, keywords] of Object.entries(COLONIA_KEYWORDS)) {
    for (const kw of keywords) {
      const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normalizedKw)) {
        const zone = zones.find((z) => z.slug === slug);
        if (zone) return zone;
      }
    }
  }
  return null;
}

export interface AssignmentResult {
  zoneId: string | null;
  method: "bbox" | "nearest" | "keyword" | "none";
}

/**
 * Assigns a listing to a zone using:
 * 1. Bounding-box check (fast, spatial)
 * 2. Nearest-zone fallback (lat/lng available)
 * 3. Keyword matching in title/address (no coordinates)
 */
export function assignZone(
  lat: number | null,
  lng: number | null,
  address: string | null,
  title: string | null,
  zones: Zone[]
): AssignmentResult {
  // 1. Bounding box
  if (lat !== null && lng !== null) {
    for (const zone of zones) {
      const bbox = ZONE_BBOXES[zone.slug];
      if (bbox && isInBoundingBox(lat, lng, bbox)) {
        return { zoneId: zone.id, method: "bbox" };
      }
    }

    // 2. Nearest zone (lat/lng available but outside all bboxes)
    const near = nearestZone(lat, lng, zones);
    if (near) {
      return { zoneId: near.id, method: "nearest" };
    }
  }

  // 3. Keyword matching
  const text = [address, title].filter(Boolean).join(" ");
  if (text) {
    const matched = matchByKeyword(text, zones);
    if (matched) {
      return { zoneId: matched.id, method: "keyword" };
    }
  }

  return { zoneId: null, method: "none" };
}
