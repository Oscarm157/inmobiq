/**
 * Fetch real OSM polygons for Tijuana zones from Nominatim.
 * Run: npx tsx scripts/fetch-polygons.ts
 *
 * Writes the result to src/lib/zone-polygons.ts as a GeoJSON FeatureCollection.
 */

import * as fs from "fs"
import * as path from "path"

interface ZoneQuery {
  slug: string
  name: string
  query: string
  // Fallback rectangular polygon in [lng, lat] pairs if Nominatim fails
  fallback: [number, number][]
}

const ZONES: ZoneQuery[] = [
  {
    slug: "zona-rio",
    name: "Zona Río",
    query: "Zona Río, Tijuana, Baja California, Mexico",
    fallback: [[-117.050, 32.526], [-117.020, 32.526], [-117.020, 32.506], [-117.050, 32.506], [-117.050, 32.526]],
  },
  {
    slug: "playas-de-tijuana",
    name: "Playas de Tijuana",
    query: "Playas de Tijuana, Tijuana, Baja California, Mexico",
    fallback: [[-117.138, 32.538], [-117.108, 32.538], [-117.108, 32.511], [-117.138, 32.511], [-117.138, 32.538]],
  },
  {
    slug: "otay",
    name: "Otay",
    query: "Otay, Tijuana, Baja California, Mexico",
    fallback: [[-116.983, 32.548], [-116.953, 32.548], [-116.953, 32.518], [-116.983, 32.518], [-116.983, 32.548]],
  },
  {
    slug: "chapultepec",
    name: "Chapultepec",
    query: "Chapultepec, Tijuana, Baja California, Mexico",
    fallback: [[-117.003, 32.530], [-116.978, 32.530], [-116.978, 32.507], [-117.003, 32.507], [-117.003, 32.530]],
  },
  {
    slug: "hipodromo",
    name: "Hipódromo",
    query: "Hipódromo, Tijuana, Baja California, Mexico",
    fallback: [[-117.010, 32.515], [-116.985, 32.515], [-116.985, 32.492], [-117.010, 32.492], [-117.010, 32.515]],
  },
  {
    slug: "centro",
    name: "Centro",
    query: "Zona Centro, Tijuana, Baja California, Mexico",
    fallback: [[-117.047, 32.544], [-117.023, 32.544], [-117.023, 32.520], [-117.047, 32.520], [-117.047, 32.544]],
  },
  {
    slug: "residencial-del-bosque",
    name: "Residencial del Bosque",
    query: "Residencial del Bosque, Tijuana, Baja California, Mexico",
    fallback: [[-117.018, 32.510], [-116.992, 32.510], [-116.992, 32.486], [-117.018, 32.486], [-117.018, 32.510]],
  },
  {
    slug: "la-mesa",
    name: "La Mesa",
    query: "La Mesa, Tijuana, Baja California, Mexico",
    fallback: [[-116.976, 32.537], [-116.951, 32.537], [-116.951, 32.512], [-116.976, 32.512], [-116.976, 32.537]],
  },
  {
    slug: "santa-fe",
    name: "Santa Fe",
    query: "Santa Fe, Tijuana, Baja California, Mexico",
    fallback: [[-117.075, 32.455], [-117.040, 32.455], [-117.040, 32.425], [-117.075, 32.425], [-117.075, 32.455]],
  },
  {
    slug: "san-antonio-del-mar",
    name: "San Antonio del Mar",
    query: "San Antonio del Mar, Tijuana, Baja California, Mexico",
    fallback: [[-117.100, 32.460], [-117.080, 32.460], [-117.080, 32.425], [-117.100, 32.425], [-117.100, 32.460]],
  },
  {
    slug: "el-florido",
    name: "El Florido",
    query: "El Florido, Tijuana, Baja California, Mexico",
    fallback: [[-116.920, 32.470], [-116.810, 32.470], [-116.810, 32.370], [-116.920, 32.370], [-116.920, 32.470]],
  },
  {
    slug: "terrazas-de-la-presa",
    name: "Terrazas de la Presa",
    query: "Terrazas de la Presa, Tijuana, Baja California, Mexico",
    fallback: [[-116.930, 32.455], [-116.840, 32.455], [-116.840, 32.415], [-116.930, 32.415], [-116.930, 32.455]],
  },
]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Douglas-Peucker simplification
function perpendicularDistance(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2)
  const u = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (mag * mag)
  const closestX = lineStart[0] + u * dx
  const closestY = lineStart[1] + u * dy
  return Math.sqrt((point[0] - closestX) ** 2 + (point[1] - closestY) ** 2)
}

function simplify(coords: [number, number][], tolerance: number): [number, number][] {
  if (coords.length <= 2) return coords

  let maxDist = 0
  let maxIdx = 0
  for (let i = 1; i < coords.length - 1; i++) {
    const dist = perpendicularDistance(coords[i], coords[0], coords[coords.length - 1])
    if (dist > maxDist) {
      maxDist = dist
      maxIdx = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplify(coords.slice(0, maxIdx + 1), tolerance)
    const right = simplify(coords.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  } else {
    return [coords[0], coords[coords.length - 1]]
  }
}

function simplifyPolygon(coords: [number, number][], targetPoints: number = 80): [number, number][] {
  if (coords.length <= targetPoints) return coords

  // Start with a small tolerance and increase until we hit target
  let tolerance = 0.00005
  let result = simplify(coords, tolerance)

  while (result.length > targetPoints && tolerance < 0.01) {
    tolerance *= 1.5
    result = simplify(coords, tolerance)
  }

  // Ensure the polygon is closed
  if (result.length > 2 && (result[0][0] !== result[result.length - 1][0] || result[0][1] !== result[result.length - 1][1])) {
    result.push(result[0])
  }

  return result
}

async function fetchPolygon(zone: ZoneQuery): Promise<{ coordinates: [number, number][][]; type: "Polygon" | "MultiPolygon" }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zone.query)}&format=geojson&polygon_geojson=1&limit=1`

  console.log(`  Fetching: ${zone.name} ...`)

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "InmobiqApp/1.0 (oscar@inmobiq.com)" },
    })

    if (!res.ok) {
      console.log(`    HTTP ${res.status}, using fallback`)
      return { type: "Polygon", coordinates: [zone.fallback] }
    }

    const data = await res.json()

    if (!data.features || data.features.length === 0) {
      console.log(`    No results, using fallback`)
      return { type: "Polygon", coordinates: [zone.fallback] }
    }

    const geom = data.features[0].geometry

    if (geom.type === "Polygon") {
      const simplified = simplifyPolygon(geom.coordinates[0])
      console.log(`    OK: Polygon with ${geom.coordinates[0].length} pts → simplified to ${simplified.length} pts`)
      return { type: "Polygon", coordinates: [simplified] }
    } else if (geom.type === "MultiPolygon") {
      const simplifiedCoords = geom.coordinates.map((poly: [number, number][][]) =>
        [simplifyPolygon(poly[0])]
      )
      const totalOrig = geom.coordinates.reduce((s: number, p: [number, number][][]) => s + p[0].length, 0)
      const totalSimp = simplifiedCoords.reduce((s: number, p: [number, number][][]) => s + p[0].length, 0)
      console.log(`    OK: MultiPolygon with ${totalOrig} pts → simplified to ${totalSimp} pts`)
      return { type: "MultiPolygon", coordinates: simplifiedCoords }
    } else if (geom.type === "Point") {
      console.log(`    Only a Point returned, using fallback`)
      return { type: "Polygon", coordinates: [zone.fallback] }
    } else {
      console.log(`    Unknown geometry type: ${geom.type}, using fallback`)
      return { type: "Polygon", coordinates: [zone.fallback] }
    }
  } catch (err) {
    console.log(`    Error: ${err}, using fallback`)
    return { type: "Polygon", coordinates: [zone.fallback] }
  }
}

async function main() {
  console.log("Fetching real OSM polygons for Tijuana zones...\n")

  const features: object[] = []

  for (let i = 0; i < ZONES.length; i++) {
    const zone = ZONES[i]
    const geom = await fetchPolygon(zone)

    features.push({
      type: "Feature",
      id: i,
      properties: {
        slug: zone.slug,
        name: zone.name,
      },
      geometry: {
        type: geom.type,
        coordinates: geom.coordinates,
      },
    })

    // Rate limit: 1 req/sec for Nominatim
    if (i < ZONES.length - 1) {
      await sleep(1200)
    }
  }

  const featureCollection = {
    type: "FeatureCollection",
    features,
  }

  // Round coordinates to 7 decimal places to reduce file size
  const jsonStr = JSON.stringify(featureCollection, (_, v) => {
    if (typeof v === "number") return Math.round(v * 10000000) / 10000000
    return v
  }, 2)

  // Write the TypeScript file
  const tsContent = `/**
 * Real OSM polygon boundaries for Tijuana zones.
 * Generated by scripts/fetch-polygons.ts from OpenStreetMap/Nominatim data.
 * Coordinates are in GeoJSON standard [lng, lat] order.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ZONE_GEOJSON: GeoJSON.FeatureCollection = ${jsonStr} as any
`

  const outPath = path.join(__dirname, "..", "src", "lib", "zone-polygons.ts")
  fs.writeFileSync(outPath, tsContent, "utf-8")
  console.log(`\nWritten to ${outPath}`)
  console.log(`Total features: ${features.length}`)
}

main().catch(console.error)
