#!/usr/bin/env npx tsx
/**
 * Import INEGI AGEB shapefiles for Tijuana and generate:
 * 1. Updated geo-data.ts with real AGEB-based polygons
 * 2. demographics.ts with Censo 2020 data per zone
 *
 * Data source: SEDATU GeoServer — AGEB Urbana SCINCE 2020 (Baja California)
 * Shapefile at: tmp/inegi/ageb_scince/a__02_AGEBU_RSCINCE_INEGI_2020_grados.*
 */

import * as shapefile from "shapefile"
import * as turf from "@turf/turf"
import * as fs from "fs"
import * as path from "path"

// The 30 existing zones with their current polygons (used for AGEB assignment)
import { ZONE_GEOJSON as EXISTING_ZONES } from "../src/lib/geo-data"
const ZONE_GEOJSON = EXISTING_ZONES

interface AgebFeature {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  properties: Record<string, any>
}

interface ZoneAgebs {
  slug: string
  name: string
  agebs: AgebFeature[]
}

interface ZoneDemographics {
  zone_slug: string
  population: number
  households: number
  occupied_dwellings: number
  avg_occupants: number
  pct_internet: number
  pct_car: number
  pct_social_security: number
  economically_active: number
  median_age: number
  ageb_count: number
}

async function loadTijuanaAgebs(): Promise<AgebFeature[]> {
  const shpPath = path.join(
    __dirname,
    "../tmp/inegi/ageb_scince/a__02_AGEBU_RSCINCE_INEGI_2020_grados.shp"
  )
  const dbfPath = path.join(
    __dirname,
    "../tmp/inegi/ageb_scince/a__02_AGEBU_RSCINCE_INEGI_2020_grados.dbf"
  )

  const source = await shapefile.open(shpPath, dbfPath)
  const agebs: AgebFeature[] = []

  while (true) {
    const { done, value } = await source.read()
    if (done) break
    // Filter: only Tijuana (municipality 02004)
    if (value.properties.Cve_MunC === "02004") {
      agebs.push({
        geometry: value.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        properties: value.properties,
      })
    }
  }

  console.log(`Loaded ${agebs.length} AGEBs for Tijuana`)
  return agebs
}

function assignAgebsToZones(
  agebs: AgebFeature[],
  zones: GeoJSON.FeatureCollection
): ZoneAgebs[] {
  const zoneMap: Map<string, ZoneAgebs> = new Map()

  // Initialize zone map
  for (const feature of zones.features) {
    const slug = (feature.properties as any).slug
    const name = (feature.properties as any).name
    zoneMap.set(slug, { slug, name, agebs: [] })
  }

  let assigned = 0
  let unassigned = 0
  const unassignedAgebs: AgebFeature[] = []

  for (const ageb of agebs) {
    const centroid = turf.centroid(ageb.geometry as any)
    let found = false

    for (const feature of zones.features) {
      try {
        if (turf.booleanPointInPolygon(centroid, feature as any)) {
          const slug = (feature.properties as any).slug
          zoneMap.get(slug)!.agebs.push(ageb)
          found = true
          assigned++
          break
        }
      } catch {
        // Skip invalid geometries
      }
    }

    if (!found) {
      unassignedAgebs.push(ageb)
      unassigned++
    }
  }

  // Assign unmatched AGEBs to nearest zone
  if (unassignedAgebs.length > 0) {
    console.log(
      `${unassigned} AGEBs didn't fall in any zone — assigning to nearest...`
    )

    // Build zone centroids for nearest-neighbor matching
    const zoneCentroids = zones.features.map((f) => ({
      slug: (f.properties as any).slug,
      centroid: turf.centroid(f as any),
    }))

    for (const ageb of unassignedAgebs) {
      const agebCentroid = turf.centroid(ageb.geometry as any)
      let nearestSlug = ""
      let nearestDist = Infinity

      for (const zc of zoneCentroids) {
        const dist = turf.distance(agebCentroid, zc.centroid)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestSlug = zc.slug
        }
      }

      if (nearestSlug) {
        zoneMap.get(nearestSlug)!.agebs.push(ageb)
        assigned++
      }
    }
  }

  console.log(`Assigned ${assigned} AGEBs to ${zoneMap.size} zones`)

  // Report zones with no AGEBs
  for (const [slug, zone] of zoneMap) {
    if (zone.agebs.length === 0) {
      console.log(`  ⚠ Zone "${slug}" has 0 AGEBs`)
    } else {
      console.log(`  ${slug}: ${zone.agebs.length} AGEBs`)
    }
  }

  return Array.from(zoneMap.values())
}

function buildZonePolygons(
  zoneAgebs: ZoneAgebs[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []

  for (let i = 0; i < zoneAgebs.length; i++) {
    const zone = zoneAgebs[i]

    if (zone.agebs.length === 0) {
      // Keep original polygon for zones with no AGEBs
      const original = ZONE_GEOJSON.features.find(
        (f: any) => f.properties.slug === zone.slug
      )
      if (original) {
        features.push({
          type: "Feature",
          id: i,
          properties: { slug: zone.slug, name: zone.name },
          geometry: original.geometry,
        })
      }
      continue
    }

    // Convert all AGEB geometries to turf polygons and union them
    let merged: any = null
    let failCount = 0

    for (const ageb of zone.agebs) {
      try {
        const poly = ageb.geometry.type === "MultiPolygon"
          ? turf.multiPolygon(ageb.geometry.coordinates)
          : turf.polygon(ageb.geometry.coordinates)

        if (!merged) {
          merged = poly
        } else {
          const result = turf.union(
            turf.featureCollection([merged, poly])
          )
          if (result) merged = result
        }
      } catch (e) {
        failCount++
      }
    }

    if (failCount > 0) {
      console.log(
        `  ${zone.slug}: ${failCount} AGEB union failures (non-critical)`
      )
    }

    if (!merged) {
      console.log(`  ⚠ ${zone.slug}: union produced null, keeping original`)
      const original = ZONE_GEOJSON.features.find(
        (f: any) => f.properties.slug === zone.slug
      )
      if (original) {
        features.push({
          type: "Feature",
          id: i,
          properties: { slug: zone.slug, name: zone.name },
          geometry: original.geometry,
        })
      }
      continue
    }

    // Simplify to reduce size (tolerance ~0.0005 ≈ 50m)
    const simplified = turf.simplify(merged, {
      tolerance: 0.0005,
      highQuality: true,
    })

    features.push({
      type: "Feature",
      id: i,
      properties: { slug: zone.slug, name: zone.name },
      geometry: simplified.geometry,
    })
  }

  return { type: "FeatureCollection", features }
}

function computeDemographics(zoneAgebs: ZoneAgebs[]): ZoneDemographics[] {
  return zoneAgebs.map((zone) => {
    let population = 0
    let households = 0
    let occupiedDwellings = 0
    let totalOccupants = 0
    let viviendaCount = 0
    let vphInternet = 0
    let vphAutom = 0
    let vphTotal = 0
    let derSS = 0
    let pea = 0
    let ageSum = 0
    let ageCount = 0

    for (const ageb of zone.agebs) {
      const p = ageb.properties
      population += p.POB_TOT || 0
      households += p.TOTHOG || 0
      occupiedDwellings += p.TVIVHAB || 0

      // Average occupants — weighted
      if (p.PROM_OCUP && p.TVIVHAB) {
        totalOccupants += p.PROM_OCUP * p.TVIVHAB
        viviendaCount += p.TVIVHAB
      }

      // Internet & car — absolute counts
      vphInternet += p.VPH_INTER || 0
      vphAutom += p.VPH_AUTOM || 0
      vphTotal += p.TVPH_CC ?? p.TVIVHAB ?? 0

      // Social security
      derSS += p.PDER_SS || 0

      // Economically active
      pea += p.PEA || 0

      // EMPOBTOT = Edad mediana de la población total
      if (p.EMPOBTOT && p.POB_TOT) {
        ageSum += p.EMPOBTOT * p.POB_TOT
        ageCount += p.POB_TOT
      }
    }

    return {
      zone_slug: zone.slug,
      population,
      households,
      occupied_dwellings: occupiedDwellings,
      avg_occupants: viviendaCount > 0
        ? Math.round((totalOccupants / viviendaCount) * 10) / 10
        : 0,
      pct_internet: vphTotal > 0
        ? Math.round((vphInternet / vphTotal) * 1000) / 10
        : 0,
      pct_car: vphTotal > 0
        ? Math.round((vphAutom / vphTotal) * 1000) / 10
        : 0,
      pct_social_security: population > 0
        ? Math.round((derSS / population) * 1000) / 10
        : 0,
      economically_active: pea,
      median_age: ageCount > 0
        ? Math.round((ageSum / ageCount) * 10) / 10
        : 0,
      ageb_count: zone.agebs.length,
    }
  })
}

function roundCoords(coords: any, decimals = 5): any {
  if (typeof coords === "number") {
    return Math.round(coords * 10 ** decimals) / 10 ** decimals
  }
  if (Array.isArray(coords)) {
    return coords.map((c) => roundCoords(c, decimals))
  }
  return coords
}

function writeGeoData(geojson: GeoJSON.FeatureCollection): void {
  // Round coordinates to 5 decimal places (~1m precision)
  const rounded = JSON.parse(JSON.stringify(geojson))
  for (const feature of rounded.features) {
    feature.geometry.coordinates = roundCoords(feature.geometry.coordinates)
  }

  const outPath = path.join(__dirname, "../src/lib/geo-data.ts")
  const jsonStr = JSON.stringify(rounded, null, 2)
  const sizeKB = Math.round(Buffer.byteLength(jsonStr) / 1024)
  console.log(`\nGeoJSON size: ${sizeKB}KB`)

  const content = `/**
 * GeoJSON polygons for Tijuana zones.
 * Generated by scripts/import-inegi.ts from INEGI AGEB data (Censo 2020).
 * Polygons are unions of AGEBs (Áreas Geoestadísticas Básicas) from SEDATU/INEGI.
 * Coordinates in GeoJSON standard [lng, lat] order.
 *
 * Source: INEGI Marco Geoestadístico 2020 / SCINCE 2020 via SEDATU GeoServer
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ZONE_GEOJSON: GeoJSON.FeatureCollection = ${jsonStr} as any

/** Compute centroid of a zone polygon by averaging all coordinates */
export function getZoneCentroid(slug: string): [number, number] | null {
  const feature = ZONE_GEOJSON.features.find(
    (f) => (f.properties as { slug: string }).slug === slug
  )
  if (!feature || !feature.geometry) return null

  const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
  let coords: number[][]

  if (geom.type === "MultiPolygon") {
    // Flatten all rings of all polygons
    coords = geom.coordinates.flatMap((poly) => poly[0])
  } else {
    coords = geom.coordinates[0]
  }

  const len = coords.length - 1
  if (len <= 0) return null

  let lngSum = 0
  let latSum = 0
  for (let i = 0; i < len; i++) {
    lngSum += coords[i][0]
    latSum += coords[i][1]
  }
  return [lngSum / len, latSum / len]
}

// Choropleth color scale based on price per m2
export function getPriceColor(pricePerM2: number): string {
  if (pricePerM2 >= 40000) return "#1e40af" // dark blue — premium
  if (pricePerM2 >= 32000) return "#3b82f6" // blue
  if (pricePerM2 >= 26000) return "#60a5fa" // light blue
  if (pricePerM2 >= 20000) return "#93c5fd" // pale blue
  return "#bfdbfe"                           // very pale
}

export function getPriceLabel(pricePerM2: number): string {
  if (pricePerM2 >= 40000) return "Premium"
  if (pricePerM2 >= 32000) return "Alto"
  if (pricePerM2 >= 26000) return "Medio-Alto"
  if (pricePerM2 >= 20000) return "Medio"
  return "Accesible"
}

// Mapbox uses [lng, lat] order
export const TIJUANA_CENTER: [number, number] = [-117.000, 32.490]
export const TIJUANA_BOUNDS: [[number, number], [number, number]] = [
  [-117.200, 32.360], // southwest
  [-116.750, 32.600], // northeast
]
`

  fs.writeFileSync(outPath, content)
  console.log(`Wrote ${outPath}`)
}

function writeDemographics(demographics: ZoneDemographics[]): void {
  const outDir = path.join(__dirname, "../src/lib/data")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, "demographics.ts")
  const data = JSON.stringify(demographics, null, 2)

  const content = `/**
 * Demographic data per zone from INEGI Censo 2020 (SCINCE).
 * Generated by scripts/import-inegi.ts
 *
 * Source: INEGI SCINCE 2020 via SEDATU GeoServer
 * Note: Encuesta Intercensal 2025 estará disponible en septiembre 2026.
 */

export interface ZoneDemographics {
  zone_slug: string
  population: number
  households: number
  occupied_dwellings: number
  avg_occupants: number
  pct_internet: number
  pct_car: number
  pct_social_security: number
  economically_active: number
  median_age: number
  ageb_count: number
}

const ZONE_DEMOGRAPHICS: ZoneDemographics[] = ${data}

export function getZoneDemographics(slug: string): ZoneDemographics | null {
  return ZONE_DEMOGRAPHICS.find((d) => d.zone_slug === slug) ?? null
}

export function getAllDemographics(): ZoneDemographics[] {
  return ZONE_DEMOGRAPHICS
}
`

  fs.writeFileSync(outPath, content)
  console.log(`Wrote ${outPath}`)
}

async function main() {
  console.log("=== INEGI AGEB Import for Inmobiq ===\n")

  // 1. Load Tijuana AGEBs
  const agebs = await loadTijuanaAgebs()

  // 2. Assign AGEBs to zones
  const zoneAgebs = assignAgebsToZones(agebs, ZONE_GEOJSON)

  // 3. Build union polygons per zone
  console.log("\nBuilding zone polygons (union of AGEBs)...")
  const geojson = buildZonePolygons(zoneAgebs)

  // 4. Compute demographics per zone
  console.log("\nComputing demographics...")
  const demographics = computeDemographics(zoneAgebs)

  // 5. Write outputs
  writeGeoData(geojson)
  writeDemographics(demographics)

  // Summary
  console.log("\n=== Summary ===")
  const withAgebs = zoneAgebs.filter((z) => z.agebs.length > 0)
  console.log(`Zones with AGEB data: ${withAgebs.length}/${zoneAgebs.length}`)
  const totalPop = demographics.reduce((s, d) => s + d.population, 0)
  console.log(`Total population covered: ${totalPop.toLocaleString()}`)
  console.log("Done!")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
