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
// Strategy: UNION the existing polygon with CP polygons to expand, not replace.
// This ensures we never lose AGEBs that the current polygon already captures.

const ZONE_CP_MAP: Record<string, { cps: number[]; existingSlugs: string[] }> = {
  "hipodromo-chapultepec": {
    cps: [22020, 22025],
    existingSlugs: ["chapultepec", "hipodromo"],  // Union both existing zones + CPs
  },
  "agua-caliente": {
    cps: [22024, 22030],
    existingSlugs: ["agua-caliente"],
  },
  "cacho": {
    cps: [22044, 22045, 22046],
    existingSlugs: ["cacho"],
  },
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
  console.log(`\n─── ${zoneSlug} ───`)

  // Collect all features to union: existing zone polygons + CP polygons
  const featuresToUnion: GeoJSON.Feature[] = []

  // Add existing zone polygons
  for (const slug of config.existingSlugs) {
    const existing = ZONE_GEOJSON.features.find((f: any) => f.properties?.slug === slug)
    if (existing) {
      featuresToUnion.push(existing as GeoJSON.Feature)
      const area = turf.area(existing as any) / 1_000_000
      console.log(`  Existing "${slug}": ${area.toFixed(2)} km²`)
    }
  }

  // Add CP polygons
  for (const cp of config.cps) {
    const feat = cpPolygons.get(cp)
    if (feat) {
      featuresToUnion.push(feat)
      console.log(`  CP ${cp}: ${feat.geometry.coordinates[0].length} vertices`)
    } else {
      console.log(`  ⚠ CP ${cp}: NOT FOUND`)
    }
  }

  if (featuresToUnion.length === 0) {
    console.log(`  SKIPPED — no features to union`)
    continue
  }

  // Union all features together
  let unified: any = featuresToUnion[0]
  for (let i = 1; i < featuresToUnion.length; i++) {
    try {
      unified = turf.union(
        turf.featureCollection([unified, featuresToUnion[i]])
      )
    } catch (e) {
      console.log(`  ⚠ Union failed at step ${i}: ${e}`)
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
const slugsToRemove = new Set(["hipodromo"]) // merged into hipodromo-chapultepec
const slugsToReplace = new Set(["chapultepec", "agua-caliente", "cacho"])

for (const existing of ZONE_GEOJSON.features) {
  const slug = (existing.properties as any)?.slug
  const name = (existing.properties as any)?.name

  if (slugsToRemove.has(slug)) {
    console.log(`  REMOVED: ${slug}`)
    continue
  }

  if (slug === "chapultepec") {
    // Replace with hipodromo-chapultepec
    const newPoly = newPolygons.get("hipodromo-chapultepec")
    if (newPoly) {
      features.push({
        type: "Feature",
        id: id++,
        properties: { slug: "hipodromo-chapultepec", name: "Hipódromo-Chapultepec" },
        geometry: newPoly.geometry,
      })
      console.log(`  REPLACED: chapultepec → hipodromo-chapultepec`)
    }
    continue
  }

  if (slugsToReplace.has(slug)) {
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
