#!/usr/bin/env npx tsx
/**
 * Fix zone polygons by using SEPOMEX postal code boundaries.
 *
 * Reads CP polygons from the open-mexico GeoJSON file and unions them
 * to create corrected zone polygons for zones that have bad boundaries.
 *
 * Usage: npx tsx scripts/fix-zone-polygons.ts
 *
 * Prerequisites:
 *   /tmp/bc_colonias.geojson — from https://github.com/open-mexico/mexico-geojson (02-Bc.geojson)
 *   /tmp/tijuana_agebs_api.json — from https://gaia.inegi.org.mx/wscatgeo/v2/geo/agebu/02/004
 */

import * as fs from "fs"
import * as turf from "@turf/turf"
import { ZONE_GEOJSON } from "../src/lib/geo-data"

// ─── Zone → CP mapping (approved by user) ────────────────────────────────────
// Strategy:
//   - "expand": UNION existing polygon + CP polygons (zones already close)
//   - "relocate": TRANSLATE existing polygon to the CP centroid (zones far off but right size)

const ZONE_CP_MAP: Record<string, { cps: number[]; mode: "expand" | "relocate" }> = {
  // ─── Zones already in correct position — expand with CPs ───
  "hipodromo-chapultepec": { cps: [22020, 22025], mode: "expand" },
  "agua-caliente":          { cps: [22024, 22030], mode: "expand" },
  "cacho":                  { cps: [22044, 22045, 22046], mode: "expand" },
  "villa-fontana":          { cps: [22200, 22210], mode: "expand" },
  "centro":                 { cps: [22000, 22100], mode: "expand" },
  "lomas-de-agua-caliente": { cps: [22034], mode: "expand" },
  // ─── Zones severely misplaced — relocate to correct position ───
  "playas-de-tijuana":      { cps: [22400, 22410], mode: "relocate" },
  "libertad":               { cps: [22105, 22106], mode: "relocate" },
  "las-americas":           { cps: [22640], mode: "relocate" },
  "insurgentes":            { cps: [22117], mode: "relocate" },
  "otay":                   { cps: [22600], mode: "relocate" },
  "el-florido":             { cps: [22237, 22244], mode: "relocate" },
  "la-mesa":                { cps: [22040], mode: "relocate" },
  "baja-malibu":            { cps: [22560], mode: "relocate" },
  "soler":                  { cps: [22500], mode: "relocate" },
}

// ─── Load SEPOMEX CP polygons ────────────────────────────────────────────────

const cpData = JSON.parse(fs.readFileSync("/tmp/bc_colonias.geojson", "utf-8"))

const cpPolygons = new Map<number, GeoJSON.Feature<GeoJSON.Polygon>>()
for (const feat of cpData.features) {
  const cp = feat.properties?.d_codigo
  if (cp && feat.geometry?.type === "Polygon") {
    cpPolygons.set(cp, feat as GeoJSON.Feature<GeoJSON.Polygon>)
  }
}

// ─── Load INEGI AGEBs for verification ───────────────────────────────────────

const inegiData = JSON.parse(fs.readFileSync("/tmp/tijuana_agebs_api.json", "utf-8"))

function getAgebCentroid(feat: any): [number, number] | null {
  const geom = feat.geometry
  const coords: number[][] = []
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) coords.push(...ring)
    }
  } else if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) coords.push(...ring)
  }
  if (!coords.length) return null
  const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  return [lon, lat]
}

// ─── Build unified polygons ──────────────────────────────────────────────────

console.log("Building expanded zone polygons (existing + SEPOMEX CPs)...\n")

const newPolygons = new Map<string, GeoJSON.Feature>()

for (const [zoneSlug, config] of Object.entries(ZONE_CP_MAP)) {
  console.log(`\n─── ${zoneSlug} (${config.mode}) ───`)

  // Get CP target centroid
  const cpFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] = []
  for (const cp of config.cps) {
    const feat = cpPolygons.get(cp)
    if (feat) {
      cpFeatures.push(feat)
      console.log(`  CP ${cp}: ${feat.geometry.coordinates[0].length} vertices`)
    } else {
      console.log(`  ⚠ CP ${cp}: NOT FOUND`)
    }
  }

  const existing = ZONE_GEOJSON.features.find((f: any) => f.properties?.slug === zoneSlug)
  let unified: any = null

  if (config.mode === "relocate" && existing && cpFeatures.length > 0) {
    // Compute target centroid from CP polygons
    let cpUnion: any = cpFeatures[0]
    for (let i = 1; i < cpFeatures.length; i++) {
      try { cpUnion = turf.union(turf.featureCollection([cpUnion, cpFeatures[i]])) } catch {}
    }
    const targetCenter = turf.centroid(cpUnion)
    const currentCenter = turf.centroid(existing as any)

    const dLng = targetCenter.geometry.coordinates[0] - currentCenter.geometry.coordinates[0]
    const dLat = targetCenter.geometry.coordinates[1] - currentCenter.geometry.coordinates[1]

    console.log(`  Relocating: Δlng=${dLng.toFixed(5)}, Δlat=${dLat.toFixed(5)}`)

    // Translate coordinates
    function translateCoords(coords: any): any {
      if (typeof coords[0] === "number") {
        return [coords[0] + dLng, coords[1] + dLat, ...coords.slice(2)]
      }
      return coords.map(translateCoords)
    }

    const existingArea = turf.area(existing as any) / 1_000_000
    console.log(`  Existing: ${existingArea.toFixed(2)} km² (keeping size, moving position)`)

    unified = {
      type: "Feature",
      properties: {},
      geometry: {
        type: (existing as any).geometry.type,
        coordinates: translateCoords((existing as any).geometry.coordinates),
      },
    }
  } else if (config.mode === "expand" && existing) {
    // Union existing + CPs
    const featuresToUnion: GeoJSON.Feature[] = [existing as GeoJSON.Feature, ...cpFeatures]
    const area = turf.area(existing as any) / 1_000_000
    console.log(`  Existing: ${area.toFixed(2)} km²`)

    unified = featuresToUnion[0]
    for (let i = 1; i < featuresToUnion.length; i++) {
      try {
        unified = turf.union(turf.featureCollection([unified, featuresToUnion[i]]))
      } catch (e) {
        console.log(`  ⚠ Union failed at step ${i}: ${e}`)
      }
    }
  }

  if (!unified) continue

  // Count AGEBs captured
  let agebCount = 0
  let totalPop = 0
  for (const ageb of inegiData.features) {
    const centroid = getAgebCentroid(ageb)
    if (!centroid) continue
    const pt = turf.point(centroid)
    try {
      if (turf.booleanPointInPolygon(pt, unified)) {
        agebCount++
        totalPop += parseInt(ageb.properties.pob_total || "0")
      }
    } catch {}
  }

  const area = turf.area(unified) / 1_000_000
  console.log(`  → Result: ${area.toFixed(2)} km² | ${agebCount} AGEBs | pop ${totalPop.toLocaleString()}`)

  newPolygons.set(zoneSlug, unified)
}

// ─── Update geo-data.ts ──────────────────────────────────────────────────────

console.log("\n\n═══ Updating geo-data.ts ═══\n")

const features: GeoJSON.Feature[] = []
let id = 0
const allReplaceSlugs = new Set(Object.keys(ZONE_CP_MAP))

for (const existing of ZONE_GEOJSON.features) {
  const slug = (existing.properties as any)?.slug
  const name = (existing.properties as any)?.name

  if (allReplaceSlugs.has(slug)) {
    const newPoly = newPolygons.get(slug)
    if (newPoly) {
      features.push({
        type: "Feature",
        id: id++,
        properties: { slug, name },
        geometry: newPoly.geometry,
      })
      console.log(`  REPLACED: ${slug}`)
      continue
    }
  }

  // Keep as-is
  features.push({
    type: "Feature",
    id: id++,
    properties: { slug, name },
    geometry: existing.geometry,
  })
}

// Write updated GeoJSON to a temp file for review
const updatedGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features,
}

const outPath = "/tmp/updated_zone_geojson.json"
fs.writeFileSync(outPath, JSON.stringify(updatedGeoJSON, null, 2))
console.log(`\nWrote ${features.length} zones to ${outPath}`)
console.log(`\nPrevious: ${ZONE_GEOJSON.features.length} zones`)
console.log(`Updated: ${features.length} zones (removed hipódromo, chapultepec → hipódromo-chapultepec)`)

// ─── Comparison: before vs after ─────────────────────────────────────────────

console.log("\n\n═══ AGEB Capture Comparison ═══\n")

const checkZones = ["hipodromo-chapultepec", "agua-caliente", "cacho"]
for (const slug of checkZones) {
  const newFeat = features.find((f) => (f.properties as any)?.slug === slug)
  if (!newFeat) continue

  // Count AGEBs in new polygon
  let newCount = 0, newPop = 0
  for (const ageb of inegiData.features) {
    const centroid = getAgebCentroid(ageb)
    if (!centroid) continue
    const pt = turf.point(centroid)
    try {
      if (turf.booleanPointInPolygon(pt, newFeat as any)) {
        newCount++
        newPop += parseInt(ageb.properties.pob_total || "0")
      }
    } catch {}
  }

  // Count AGEBs in old polygons
  const oldSlugs = slug === "hipodromo-chapultepec" ? ["hipodromo", "chapultepec"] : [slug]
  let oldCount = 0, oldPop = 0
  for (const oldSlug of oldSlugs) {
    const oldFeat = ZONE_GEOJSON.features.find((f: any) => f.properties?.slug === oldSlug)
    if (!oldFeat) continue
    for (const ageb of inegiData.features) {
      const centroid = getAgebCentroid(ageb)
      if (!centroid) continue
      const pt = turf.point(centroid)
      try {
        if (turf.booleanPointInPolygon(pt, oldFeat as any)) {
          oldCount++
          oldPop += parseInt(ageb.properties.pob_total || "0")
        }
      } catch {}
    }
  }

  console.log(`${slug}:`)
  console.log(`  BEFORE: ${oldCount} AGEBs, pop ${oldPop.toLocaleString()} (from ${oldSlugs.join(" + ")})`)
  console.log(`  AFTER:  ${newCount} AGEBs, pop ${newPop.toLocaleString()}`)
  console.log(`  Δ AGEBs: ${newCount - oldCount >= 0 ? "+" : ""}${newCount - oldCount}, Δ pop: ${newPop - oldPop >= 0 ? "+" : ""}${(newPop - oldPop).toLocaleString()}`)
  console.log()
}
