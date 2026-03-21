import type { Zone } from "./types";

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

// ─── Bounding box (secondary check) ────────────────────────────────────────

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

function isInBoundingBox(lat: number, lng: number, bbox: BoundingBox): boolean {
  const [minLat, maxLat, minLng, maxLng] = bbox;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

function matchByBbox(lat: number, lng: number, zones: Zone[]): Zone | null {
  for (const zone of zones) {
    const bbox = ZONE_BBOXES[zone.slug];
    if (bbox && isInBoundingBox(lat, lng, bbox)) {
      return zone;
    }
  }
  return null;
}

// ─── Main assignment logic ──────────────────────────────────────────────────

export interface AssignmentResult {
  zoneId: string | null;
  method: "colonia" | "bbox" | "none";
  /** If no zone matched, this is the extracted colonia name for auto-creation */
  newColoniaName: string | null;
}

/**
 * Assigns a listing to a zone using:
 * 1. Extract colonia from address → match to existing zone (normalized + fuzzy)
 * 2. Bounding-box check with coords (only for well-known zones)
 * 3. If no match → return colonia name for potential auto-creation
 *
 * NEVER forces to "nearest zone" — if it doesn't match, it's a new zone.
 */
export function assignZone(
  lat: number | null,
  lng: number | null,
  address: string | null,
  title: string | null,
  zones: Zone[],
): AssignmentResult {
  // 1. Try colonia-based matching first (most accurate)
  const colonia = extractColonia(address);
  if (colonia) {
    const matched = matchColoniaToZone(colonia, zones);
    if (matched) {
      return { zoneId: matched.id, method: "colonia", newColoniaName: null };
    }
  }

  // 2. Bounding box (only for known zones with hardcoded boxes)
  if (lat !== null && lng !== null) {
    const bboxMatch = matchByBbox(lat, lng, zones);
    if (bboxMatch) {
      return { zoneId: bboxMatch.id, method: "bbox", newColoniaName: null };
    }
  }

  // 3. No match — return colonia name for auto-creation
  return {
    zoneId: null,
    method: "none",
    newColoniaName: colonia,
  };
}
