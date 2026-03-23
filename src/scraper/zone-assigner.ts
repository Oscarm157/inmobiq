import type { Zone } from "./types";
import { booleanPointInPolygon, point } from "@turf/turf";
import { ZONE_GEOJSON } from "@/lib/geo-data";

// ─── Normalization ──────────────────────────────────────────────────────────

/** Remove accents, lowercase, collapse whitespace */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generate a URL-safe slug from a name */
export function slugify(text: string): string {
  return normalize(text).replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ─── Colonia extraction ─────────────────────────────────────────────────────

/** Noise words to strip from address parsing */
const NOISE = new Set([
  "tijuana", "baja california", "bc", "b.c.", "b c", "mexico", "méxico", "mex",
]);

/**
 * Extract the colonia/neighborhood from an address string.
 * Addresses are typically: "Street 123, Colonia, Tijuana, B.C."
 * We want the second-to-last meaningful part, or the last one.
 */
export function extractColonia(address: string | null): string | null {
  if (!address) return null;

  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => !s.match(/^\d{4,5}$/)) // remove zip codes
    .filter((s) => !NOISE.has(normalize(s)));

  if (parts.length === 0) return null;

  // The colonia is typically the LAST meaningful part after filtering noise
  // If there are 2+ parts, last is colonia, first is street
  return parts.length >= 2 ? parts[parts.length - 1] : parts[0];
}

// ─── Zone matching ──────────────────────────────────────────────────────────

/**
 * Try to match a colonia name to an existing zone.
 * Uses normalized comparison with fuzzy containment:
 * - Exact match (normalized)
 * - Zone name contained in colonia name (e.g. "Agua Caliente" matches "Residencial Agua Caliente")
 * - Colonia name contained in zone name
 */
export function matchColoniaToZone(
  colonia: string,
  zones: Zone[],
): Zone | null {
  const normColonia = normalize(colonia);
  if (!normColonia) return null;

  // Pass 1: exact normalized match on zone name or slug
  for (const zone of zones) {
    const normZoneName = normalize(zone.name);
    const normSlug = normalize(zone.slug.replace(/-/g, " "));
    if (normColonia === normZoneName || normColonia === normSlug) {
      return zone;
    }
  }

  // Pass 2: zone name contained in colonia, or colonia contained in zone name
  // Only match if the base name is 4+ chars (avoid false positives on short words)
  let bestMatch: Zone | null = null;
  let bestLen = 0;

  for (const zone of zones) {
    const normZoneName = normalize(zone.name);
    if (normZoneName.length < 4) continue;

    if (normColonia.includes(normZoneName) || normZoneName.includes(normColonia)) {
      // Prefer longest match (most specific zone)
      if (normZoneName.length > bestLen) {
        bestMatch = zone;
        bestLen = normZoneName.length;
      }
    }
  }

  return bestMatch;
}

// ─── Title-based zone extraction ────────────────────────────────────────────

/**
 * Extract zone name from listing title as a fallback.
 * Titles often contain zone references: "Depto en Zona Rio", "Casa en Playas".
 * Uses same fuzzy matching as colonia but against the full title text.
 */
function matchZoneFromTitle(title: string | null, zones: Zone[]): Zone | null {
  if (!title) return null;
  const normTitle = normalize(title);
  if (!normTitle) return null;

  let best: Zone | null = null;
  let bestLen = 0;

  for (const zone of zones) {
    const normName = normalize(zone.name);
    if (normName.length < 4) continue;
    if (normTitle.includes(normName) && normName.length > bestLen) {
      best = zone;
      bestLen = normName.length;
    }
  }

  return best;
}

// ─── Point-in-polygon (INEGI AGEB boundaries) ──────────────────────────────

/** Build a slug→feature lookup for fast access */
const ZONE_FEATURES = new Map(
  ZONE_GEOJSON.features.map((f) => [f.properties?.slug as string, f]),
);

/**
 * Check if coordinates fall inside any zone polygon (INEGI AGEB boundaries).
 * More precise than bounding boxes — uses actual polygon geometry.
 */
function matchByPolygon(lat: number, lng: number, zones: Zone[]): Zone | null {
  const pt = point([lng, lat]); // GeoJSON uses [lng, lat]
  for (const zone of zones) {
    const feature = ZONE_FEATURES.get(zone.slug);
    if (feature && booleanPointInPolygon(pt, feature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
      return zone;
    }
  }
  return null;
}

// ─── Nearest zone by distance ───────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

/**
 * Find the nearest zone by haversine distance.
 * Returns the zone if within maxDistKm, otherwise null.
 */
export function findNearestZone(
  lat: number,
  lng: number,
  zones: Zone[],
  maxDistKm = 3,
): Zone | null {
  let best: Zone | null = null;
  let bestDist = Infinity;

  for (const zone of zones) {
    const dist = haversineKm(lat, lng, zone.lat, zone.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = zone;
    }
  }

  return bestDist <= maxDistKm ? best : null;
}

// ─── Main assignment logic ──────────────────────────────────────────────────

export interface AssignmentResult {
  zoneId: string | null;
  method: "colonia" | "title" | "polygon" | "nearest" | "none";
}

/**
 * Assigns a listing to a zone using a 4-step cascade:
 * 1. Extract colonia from address → match to existing zone (normalized + fuzzy)
 * 2. Extract zone name from title → match to existing zone (fallback text signal)
 * 3. Point-in-polygon with INEGI AGEB boundaries (precise geographic match)
 * 4. Nearest zone by distance (within 3km radius)
 * 5. If no match → returns null (listing goes to "Otros" zone)
 */
export function assignZone(
  lat: number | null,
  lng: number | null,
  address: string | null,
  title: string | null,
  zones: Zone[],
): AssignmentResult {
  // 1. Try colonia-based matching first (most accurate — structured data)
  const colonia = extractColonia(address);
  if (colonia) {
    const matched = matchColoniaToZone(colonia, zones);
    if (matched) {
      return { zoneId: matched.id, method: "colonia" };
    }
  }

  // 2. Try extracting zone name from title (strong text signal)
  const titleMatch = matchZoneFromTitle(title, zones);
  if (titleMatch) {
    return { zoneId: titleMatch.id, method: "title" };
  }

  // 3. Point-in-polygon with INEGI AGEB boundaries (precise geometry)
  if (lat !== null && lng !== null) {
    const polygonMatch = matchByPolygon(lat, lng, zones);
    if (polygonMatch) {
      return { zoneId: polygonMatch.id, method: "polygon" };
    }

    // 4. Nearest zone by distance (within 3km)
    const nearest = findNearestZone(lat, lng, zones);
    if (nearest) {
      return { zoneId: nearest.id, method: "nearest" };
    }
  }

  // 5. No match — will be assigned to "Otros" by caller
  return { zoneId: null, method: "none" };
}
