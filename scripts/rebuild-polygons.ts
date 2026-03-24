#!/usr/bin/env npx tsx
/**
 * Rebuild zone polygons using real property locations + OSM boundaries.
 *
 * Strategy for each zone:
 * 1. If polygon already OK (<2km from listing centroid) → keep
 * 2. If OSM has a good administrative polygon → use OSM
 * 3. Otherwise → convex hull of listing GPS points + 500m buffer
 * 4. Always union with existing polygon to avoid losing AGEB coverage
 *
 * Data sources:
 * - /tmp/listing_coords.json — listing GPS from Supabase
 * - /tmp/osm_zones.json — OSM Nominatim polygons
 * - /tmp/zones_db.json — zone id→slug mapping from Supabase
 * - src/lib/geo-data.ts — current zone polygons
 */

import * as fs from "fs"
import * as turf from "@turf/turf"
import { ZONE_GEOJSON } from "../src/lib/geo-data"

// ─── Load data ───────────────────────────────────────────────────────────────

const listingsRaw: Array<{ lat: number; lng: number; zone_id: string | null }> =
  JSON.parse(fs.readFileSync("/tmp/listing_coords.json", "utf-8"))

const zonesDb: Array<{ id: string; slug: string; name: string }> =
  JSON.parse(fs.readFileSync("/tmp/zones_db.json", "utf-8"))

const osmZones: Record<string, { geojson: any; center: number[]; vertices: number; osm_type: string } | null> =
  JSON.parse(fs.readFileSync("/tmp/osm_zones.json", "utf-8"))

// Map zone_id → slug (DB uses old slugs)
const idToSlug = new Map(zonesDb.map((z) => [z.id, z.slug]))

// Map old slugs → new slugs
const SLUG_REMAP: Record<string, string> = {
  chapultepec: "hipodromo-chapultepec",
  hipodromo: "hipodromo-chapultepec",
  "residencial-del-bosque": "cerro-colorado",
  "villa-fontana": "zona-este",
  montecarlo: "el-lago-cucapah",
  federal: "zona-rio",
}

// Group listing coords by new slug
const listingsByZone = new Map<string, Array<[number, number]>>()
for (const l of listingsRaw) {
  if (!l.zone_id || !l.lat || !l.lng) continue
  const oldSlug = idToSlug.get(l.zone_id)
  if (!oldSlug) continue
  const newSlug = SLUG_REMAP[oldSlug] ?? oldSlug
  const arr = listingsByZone.get(newSlug) ?? []
  arr.push([l.lng, l.lat]) // GeoJSON order: [lng, lat]
  listingsByZone.set(newSlug, arr)
}

// OSM polygons that are actually good (administrative/residential, not shops)
const GOOD_OSM: Record<string, string> = {
  libertad: "libertad",
  otay: "otay",
  "real-del-mar": "real-del-mar",
  "lomas-virreyes": "lomas-virreyes",
}

// Zones that are already OK (< 2km)
const ZONES_OK = new Set([
  "zona-rio",
  "hipodromo-chapultepec",
  "cacho",
  "agua-caliente",
  "centro",
  "punta-bandera",
  "santa-fe",
])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCenter(feat: any): [number, number] | null {
  const coords: number[][] = []
  const geom = feat.geometry
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) for (const ring of poly) coords.push(...ring)
  } else if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) coords.push(...ring)
  }
  if (!coords.length) return null
  return [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ]
}

function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Build new polygons ──────────────────────────────────────────────────────

console.log("=== Rebuilding Zone Polygons ===\n")

const newFeatures: GeoJSON.Feature[] = []
let id = 0

for (const existing of ZONE_GEOJSON.features) {
  const slug = (existing.properties as any)?.slug as string
  const name = (existing.properties as any)?.name as string

  // Check if this zone is already OK
  if (ZONES_OK.has(slug)) {
    newFeatures.push({ ...existing, id: id++ })
    console.log(`✓ ${slug}: KEEP (already OK)`)
    continue
  }

  // Get listing centroid for comparison
  const listings = listingsByZone.get(slug) ?? []
  let listingCenter: [number, number] | null = null
  if (listings.length > 0) {
    listingCenter = [
      listings.reduce((s, c) => s + c[0], 0) / listings.length,
      listings.reduce((s, c) => s + c[1], 0) / listings.length,
    ]
  }

  // Check current polygon distance to listings
  const polyCenter = getCenter(existing)
  if (polyCenter && listingCenter) {
    const dist = haversineKm(polyCenter[0], polyCenter[1], listingCenter[0], listingCenter[1])
    if (dist < 2) {
      newFeatures.push({ ...existing, id: id++ })
      console.log(`✓ ${slug}: KEEP (${dist.toFixed(1)}km — close enough)`)
      continue
    }
  }

  // --- Zone needs fixing ---

  // Option 1: Use good OSM polygon
  const osmKey = GOOD_OSM[slug]
  if (osmKey && osmZones[osmKey]?.geojson) {
    const osmGeom = osmZones[osmKey]!.geojson
    // Union with existing to avoid losing AGEBs
    let unified: any = turf.feature(osmGeom)
    try {
      unified = turf.union(turf.featureCollection([unified, existing as any]))
    } catch { /* keep OSM only */ }

    newFeatures.push({
      type: "Feature",
      id: id++,
      properties: { slug, name },
      geometry: unified.geometry,
    })
    console.log(`◆ ${slug}: OSM polygon + existing (${osmZones[osmKey]!.vertices} verts)`)
    continue
  }

  // Option 2: Convex hull of listings + buffer
  if (listings.length >= 5) {
    // Filter outlier listings (>5km from centroid)
    const cLon = listings.reduce((s, c) => s + c[0], 0) / listings.length
    const cLat = listings.reduce((s, c) => s + c[1], 0) / listings.length
    const filtered = listings.filter((c) => haversineKm(c[0], c[1], cLon, cLat) < 5)

    if (filtered.length < 3) {
      newFeatures.push({ ...existing, id: id++ })
      console.log(`? ${slug}: KEEP (too few clean listings after outlier filter)`)
      continue
    }

    const points = turf.featureCollection(filtered.map((c) => turf.point(c)))
    let hull = turf.convex(points)

    if (hull) {
      // Buffer by 500m for surrounding area
      hull = turf.buffer(hull, 0.5, { units: "kilometers" }) as any

      // Only union with existing if existing is close (< 3km), otherwise REPLACE
      const existingDist = polyCenter && listingCenter
        ? haversineKm(polyCenter[0], polyCenter[1], listingCenter[0], listingCenter[1])
        : 999

      let unified: any = hull
      if (existingDist < 3) {
        try {
          unified = turf.union(turf.featureCollection([hull as any, existing as any]))
        } catch { /* keep hull only */ }
        console.log(`● ${slug}: Hull (${filtered.length} pts) + existing → expand`)
      } else {
        console.log(`● ${slug}: Hull (${filtered.length} pts) → REPLACE (old poly ${existingDist.toFixed(1)}km off)`)
      }

      newFeatures.push({
        type: "Feature",
        id: id++,
        properties: { slug, name },
        geometry: unified.geometry,
      })
      continue
    }
  }

  // Fallback: keep existing
  newFeatures.push({ ...existing, id: id++ })
  console.log(`? ${slug}: KEEP (no better data — ${listings.length} listings)`)
}

// ─── Write output ────────────────────────────────────────────────────────────

const result: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: newFeatures }
fs.writeFileSync("/tmp/rebuilt_zones.json", JSON.stringify(result, null, 2))

console.log(`\n${"=".repeat(50)}`)
console.log(`Output: ${newFeatures.length} zones → /tmp/rebuilt_zones.json`)

// ─── Validate ────────────────────────────────────────────────────────────────

console.log("\n=== Validation: New polygons vs listing centroids ===\n")
let okCount = 0
let badCount = 0

for (const feat of newFeatures) {
  const slug = (feat.properties as any)?.slug as string
  const listings = listingsByZone.get(slug) ?? []
  if (listings.length < 3) continue

  const lCenter: [number, number] = [
    listings.reduce((s, c) => s + c[0], 0) / listings.length,
    listings.reduce((s, c) => s + c[1], 0) / listings.length,
  ]

  const pCenter = getCenter(feat)
  if (!pCenter) continue

  const dist = haversineKm(pCenter[0], pCenter[1], lCenter[0], lCenter[1])
  const status = dist < 2 ? "OK" : dist < 3 ? "~" : "BAD"
  if (dist < 2) okCount++; else badCount++

  console.log(`  ${slug.padEnd(28)} ${dist.toFixed(1).padStart(5)}km  ${status}`)
}

console.log(`\n✓ OK: ${okCount} | ✗ Bad: ${badCount}`)
