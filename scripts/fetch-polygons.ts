/**
 * Fetch real OSM polygons for Tijuana zones.
 * Run: npx tsx scripts/fetch-polygons.ts
 *
 * Strategy (3 fallback levels):
 *   1. Overpass API — search for boundary relations in OSM
 *   2. Nominatim — search by name with polygon_geojson=1
 *   3. Researched fallback rectangle
 *
 * Writes the result to src/lib/geo-data.ts, preserving utility functions.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
 */

import * as fs from "fs"
import * as path from "path"

// ─── Zone definitions ────────────────────────────────────────────────────────

interface ZoneQuery {
  slug: string
  name: string
  /** Nominatim search query */
  query: string
  /** Optional Overpass relation name to search within Tijuana */
  overpassName?: string
  /** Fallback rectangular polygon in [lng, lat] pairs */
  fallback: [number, number][]
}

const ZONES: ZoneQuery[] = [
  // ─── Existing 8 zones ────────────────────────────────────────────────
  {
    slug: "zona-rio",
    name: "Zona Río",
    query: "Zona Urbana Rio Tijuana, Tijuana, Baja California, Mexico",
    overpassName: "Zona Urbana Río Tijuana",
    fallback: [[-117.050, 32.526], [-117.020, 32.526], [-117.020, 32.506], [-117.050, 32.506], [-117.050, 32.526]],
  },
  {
    slug: "playas-de-tijuana",
    name: "Playas de Tijuana",
    query: "Playas de Tijuana, Tijuana, Baja California, Mexico",
    overpassName: "Playas de Tijuana",
    fallback: [[-117.140, 32.540], [-117.105, 32.540], [-117.105, 32.510], [-117.140, 32.510], [-117.140, 32.540]],
  },
  {
    slug: "otay",
    name: "Otay",
    query: "Otay, Tijuana, Baja California, Mexico",
    overpassName: "Otay",
    fallback: [[-116.980, 32.555], [-116.945, 32.555], [-116.945, 32.530], [-116.980, 32.530], [-116.980, 32.555]],
  },
  {
    slug: "chapultepec",
    name: "Chapultepec",
    query: "Colonia Chapultepec, Tijuana, Baja California, Mexico",
    overpassName: "Chapultepec",
    fallback: [[-117.015, 32.510], [-116.995, 32.510], [-116.995, 32.490], [-117.015, 32.490], [-117.015, 32.510]],
  },
  {
    slug: "hipodromo",
    name: "Hipódromo",
    query: "Hipódromo, Tijuana, Baja California, Mexico",
    overpassName: "Hipódromo",
    fallback: [[-117.005, 32.520], [-116.985, 32.520], [-116.985, 32.500], [-117.005, 32.500], [-117.005, 32.520]],
  },
  {
    slug: "centro",
    name: "Centro",
    query: "Zona Centro, Tijuana, Baja California, Mexico",
    overpassName: "Zona Centro",
    fallback: [[-117.050, 32.540], [-117.025, 32.540], [-117.025, 32.525], [-117.050, 32.525], [-117.050, 32.540]],
  },
  {
    slug: "residencial-del-bosque",
    name: "Residencial del Bosque",
    query: "Residencial del Bosque, Tijuana, Baja California, Mexico",
    fallback: [[-116.935, 32.480], [-116.910, 32.480], [-116.910, 32.460], [-116.935, 32.460], [-116.935, 32.480]],
  },
  {
    slug: "la-mesa",
    name: "La Mesa",
    query: "La Mesa, Tijuana, Baja California, Mexico",
    overpassName: "La Mesa",
    fallback: [[-116.975, 32.515], [-116.950, 32.515], [-116.950, 32.490], [-116.975, 32.490], [-116.975, 32.515]],
  },
  // ─── Premium/Central ────────────────────────────────────────────────
  {
    slug: "cacho",
    name: "Cacho",
    query: "Colonia Cacho, Tijuana, Baja California, Mexico",
    overpassName: "Cacho",
    fallback: [[-117.035, 32.530], [-117.015, 32.530], [-117.015, 32.515], [-117.035, 32.515], [-117.035, 32.530]],
  },
  {
    slug: "agua-caliente",
    name: "Agua Caliente",
    query: "Agua Caliente, Tijuana, Baja California, Mexico",
    overpassName: "Agua Caliente",
    fallback: [[-117.010, 32.515], [-116.988, 32.515], [-116.988, 32.498], [-117.010, 32.498], [-117.010, 32.515]],
  },
  {
    slug: "lomas-de-agua-caliente",
    name: "Lomas de Agua Caliente",
    query: "Lomas de Agua Caliente, Tijuana, Baja California, Mexico",
    fallback: [[-117.005, 32.498], [-116.980, 32.498], [-116.980, 32.478], [-117.005, 32.478], [-117.005, 32.498]],
  },
  // ─── Frontera/Norte ─────────────────────────────────────────────────
  {
    slug: "libertad",
    name: "Libertad",
    query: "Colonia Libertad, Tijuana, Baja California, Mexico",
    overpassName: "Libertad",
    fallback: [[-117.060, 32.545], [-117.040, 32.545], [-117.040, 32.530], [-117.060, 32.530], [-117.060, 32.545]],
  },
  {
    slug: "soler",
    name: "Soler",
    query: "Colonia Soler, Tijuana, Baja California, Mexico",
    fallback: [[-117.055, 32.535], [-117.038, 32.535], [-117.038, 32.520], [-117.055, 32.520], [-117.055, 32.535]],
  },
  {
    slug: "federal",
    name: "Federal",
    query: "Colonia Federal, Tijuana, Baja California, Mexico",
    fallback: [[-117.045, 32.550], [-117.025, 32.550], [-117.025, 32.538], [-117.045, 32.538], [-117.045, 32.550]],
  },
  // ─── Costa ──────────────────────────────────────────────────────────
  {
    slug: "baja-malibu",
    name: "Baja Malibú",
    query: "Baja Malibu, Tijuana, Baja California, Mexico",
    fallback: [[-117.125, 32.490], [-117.105, 32.490], [-117.105, 32.470], [-117.125, 32.470], [-117.125, 32.490]],
  },
  {
    slug: "real-del-mar",
    name: "Real del Mar",
    query: "Real del Mar, Tijuana, Baja California, Mexico",
    fallback: [[-117.120, 32.470], [-117.095, 32.470], [-117.095, 32.450], [-117.120, 32.450], [-117.120, 32.470]],
  },
  {
    slug: "san-antonio-del-mar",
    name: "San Antonio del Mar",
    query: "San Antonio del Mar, Tijuana, Baja California, Mexico",
    fallback: [[-117.105, 32.450], [-117.080, 32.450], [-117.080, 32.425], [-117.105, 32.425], [-117.105, 32.450]],
  },
  {
    slug: "punta-bandera",
    name: "Punta Bandera",
    query: "Punta Bandera, Tijuana, Baja California, Mexico",
    fallback: [[-117.115, 32.445], [-117.090, 32.445], [-117.090, 32.425], [-117.115, 32.425], [-117.115, 32.445]],
  },
  {
    slug: "costa-coronado",
    name: "Costa Coronado",
    query: "Costa Coronado, Tijuana, Baja California, Mexico",
    fallback: [[-117.110, 32.430], [-117.085, 32.430], [-117.085, 32.410], [-117.110, 32.410], [-117.110, 32.430]],
  },
  // ─── Este ───────────────────────────────────────────────────────────
  {
    slug: "las-americas",
    name: "Las Américas",
    query: "Las Americas, Tijuana, Baja California, Mexico",
    fallback: [[-116.965, 32.540], [-116.940, 32.540], [-116.940, 32.520], [-116.965, 32.520], [-116.965, 32.540]],
  },
  {
    slug: "villa-fontana",
    name: "Villa Fontana",
    query: "Villa Fontana, Tijuana, Baja California, Mexico",
    fallback: [[-116.950, 32.525], [-116.925, 32.525], [-116.925, 32.505], [-116.950, 32.505], [-116.950, 32.525]],
  },
  {
    slug: "montecarlo",
    name: "Montecarlo",
    query: "Montecarlo, Tijuana, Baja California, Mexico",
    fallback: [[-116.945, 32.510], [-116.920, 32.510], [-116.920, 32.490], [-116.945, 32.490], [-116.945, 32.510]],
  },
  {
    slug: "otay-universidad",
    name: "Otay Universidad",
    query: "Otay Universidad, Tijuana, Baja California, Mexico",
    fallback: [[-116.975, 32.545], [-116.950, 32.545], [-116.950, 32.525], [-116.975, 32.525], [-116.975, 32.545]],
  },
  // ─── Sur/Residencial ───────────────────────────────────────────────
  {
    slug: "santa-fe",
    name: "Santa Fe",
    query: "Santa Fe, Tijuana, Baja California, Mexico",
    fallback: [[-117.060, 32.455], [-117.035, 32.455], [-117.035, 32.430], [-117.060, 32.430], [-117.060, 32.455]],
  },
  {
    slug: "natura",
    name: "Natura",
    query: "Natura, Tijuana, Baja California, Mexico",
    fallback: [[-117.050, 32.440], [-117.025, 32.440], [-117.025, 32.420], [-117.050, 32.420], [-117.050, 32.440]],
  },
  {
    slug: "colinas-de-california",
    name: "Colinas de California",
    query: "Colinas de California, Tijuana, Baja California, Mexico",
    fallback: [[-117.040, 32.500], [-117.020, 32.500], [-117.020, 32.480], [-117.040, 32.480], [-117.040, 32.500]],
  },
  {
    slug: "lomas-virreyes",
    name: "Lomas Virreyes",
    query: "Lomas Virreyes, Tijuana, Baja California, Mexico",
    fallback: [[-117.035, 32.490], [-117.015, 32.490], [-117.015, 32.470], [-117.035, 32.470], [-117.035, 32.490]],
  },
  {
    slug: "insurgentes",
    name: "Insurgentes",
    query: "Colonia Insurgentes, Tijuana, Baja California, Mexico",
    fallback: [[-117.050, 32.480], [-117.030, 32.480], [-117.030, 32.460], [-117.050, 32.460], [-117.050, 32.480]],
  },
  // ─── Periférico ────────────────────────────────────────────────────
  {
    slug: "el-florido",
    name: "El Florido",
    query: "El Florido, Tijuana, Baja California, Mexico",
    fallback: [[-116.890, 32.480], [-116.850, 32.480], [-116.850, 32.450], [-116.890, 32.450], [-116.890, 32.480]],
  },
  {
    slug: "terrazas-de-la-presa",
    name: "Terrazas de la Presa",
    query: "Terrazas de la Presa, Tijuana, Baja California, Mexico",
    fallback: [[-116.920, 32.455], [-116.890, 32.455], [-116.890, 32.430], [-116.920, 32.430], [-116.920, 32.455]],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Douglas-Peucker simplification
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
): number {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0)
    return Math.sqrt(
      (point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2,
    )
  const u =
    ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) /
    (mag * mag)
  const closestX = lineStart[0] + u * dx
  const closestY = lineStart[1] + u * dy
  return Math.sqrt((point[0] - closestX) ** 2 + (point[1] - closestY) ** 2)
}

function simplify(
  coords: [number, number][],
  tolerance: number,
): [number, number][] {
  if (coords.length <= 2) return coords

  let maxDist = 0
  let maxIdx = 0
  for (let i = 1; i < coords.length - 1; i++) {
    const dist = perpendicularDistance(
      coords[i],
      coords[0],
      coords[coords.length - 1],
    )
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

function simplifyPolygon(
  coords: [number, number][],
  targetPoints: number = 80,
): [number, number][] {
  if (coords.length <= targetPoints) return coords

  let tolerance = 0.00005
  let result = simplify(coords, tolerance)

  while (result.length > targetPoints && tolerance < 0.01) {
    tolerance *= 1.5
    result = simplify(coords, tolerance)
  }

  // Ensure closed
  if (
    result.length > 2 &&
    (result[0][0] !== result[result.length - 1][0] ||
      result[0][1] !== result[result.length - 1][1])
  ) {
    result.push(result[0])
  }

  return result
}

/** Round coordinates to 6 decimal places (~0.1m precision) */
function roundCoord(n: number): number {
  return Math.round(n * 1000000) / 1000000
}

function roundCoords(coords: [number, number][]): [number, number][] {
  return coords.map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)])
}

// ─── Overpass API fetcher ─────────────────────────────────────────────────────

type GeomResult = {
  coordinates: [number, number][][]
  type: "Polygon" | "MultiPolygon"
  source: "overpass" | "nominatim" | "fallback"
}

async function fetchFromOverpass(zone: ZoneQuery): Promise<GeomResult | null> {
  if (!zone.overpassName) return null

  // Search for boundary relations within Tijuana area
  const query = `
[out:json][timeout:10];
area["name"="Tijuana"]["admin_level"~"[4-8]"]->.tj;
(
  rel(area.tj)["boundary"]["name"="${zone.overpassName}"];
  rel(area.tj)["place"]["name"="${zone.overpassName}"];
);
out geom;
`.trim()

  const url = "https://overpass-api.de/api/interpreter"

  try {
    const res = await fetch(url, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data.elements || data.elements.length === 0) return null

    // Find the element with geometry (outer members of a relation)
    for (const el of data.elements) {
      if (el.type === "relation" && el.members) {
        const outerWays = el.members.filter(
          (m: { type: string; role: string; geometry?: { lat: number; lon: number }[] }) =>
            m.type === "way" && m.role === "outer" && m.geometry,
        )
        if (outerWays.length === 0) continue

        // Combine outer way geometries into a single polygon ring
        const coords: [number, number][] = []
        for (const way of outerWays) {
          for (const pt of way.geometry) {
            coords.push([roundCoord(pt.lon), roundCoord(pt.lat)])
          }
        }

        if (coords.length < 4) continue

        // Close if not closed
        if (
          coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1]
        ) {
          coords.push(coords[0])
        }

        const simplified = simplifyPolygon(coords)
        return {
          type: "Polygon",
          coordinates: [roundCoords(simplified)],
          source: "overpass",
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// ─── Nominatim fetcher ────────────────────────────────────────────────────────

async function fetchFromNominatim(zone: ZoneQuery): Promise<GeomResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zone.query)}&format=geojson&polygon_geojson=1&limit=1`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "InmobiqApp/1.0 (oscar@inmobiq.com)" },
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data.features || data.features.length === 0) return null

    const geom = data.features[0].geometry

    if (geom.type === "Polygon") {
      const simplified = simplifyPolygon(geom.coordinates[0])
      return {
        type: "Polygon",
        coordinates: [roundCoords(simplified)],
        source: "nominatim",
      }
    } else if (geom.type === "MultiPolygon") {
      const simplifiedCoords = geom.coordinates.map(
        (poly: [number, number][][]) => [roundCoords(simplifyPolygon(poly[0]))],
      )
      return {
        type: "MultiPolygon",
        coordinates: simplifiedCoords,
        source: "nominatim",
      }
    }
    return null
  } catch {
    return null
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching OSM polygons for 30 Tijuana zones...\n")
  console.log("Strategy: Overpass API → Nominatim → Fallback rectangle\n")

  const features: object[] = []
  const stats = { overpass: 0, nominatim: 0, fallback: 0 }

  for (let i = 0; i < ZONES.length; i++) {
    const zone = ZONES[i]
    process.stdout.write(`  [${i + 1}/${ZONES.length}] ${zone.name} ... `)

    // 1. Try Overpass
    let result = await fetchFromOverpass(zone)

    // 2. Try Nominatim (with rate limiting)
    if (!result) {
      await sleep(1200) // Nominatim rate limit
      result = await fetchFromNominatim(zone)
    }

    // 3. Fallback
    if (!result) {
      result = {
        type: "Polygon",
        coordinates: [zone.fallback],
        source: "fallback",
      }
    }

    stats[result.source]++
    const ptCount =
      result.type === "Polygon"
        ? result.coordinates[0].length
        : result.coordinates.reduce(
            (s: number, p: [number, number][][]) => s + p[0].length,
            0,
          )
    console.log(`${result.source} (${ptCount} pts)`)

    features.push({
      type: "Feature",
      id: i,
      properties: { slug: zone.slug, name: zone.name },
      geometry: { type: result.type, coordinates: result.coordinates },
    })

    // Small delay between zones to avoid overwhelming APIs
    if (i < ZONES.length - 1) {
      await sleep(500)
    }
  }

  console.log(
    `\nResults: ${stats.overpass} Overpass, ${stats.nominatim} Nominatim, ${stats.fallback} fallback`,
  )

  const featureCollection = { type: "FeatureCollection", features }

  // Format JSON compactly for coordinates
  const jsonStr = JSON.stringify(
    featureCollection,
    (_, v) => {
      if (typeof v === "number") return roundCoord(v)
      return v
    },
    2,
  )

  // Read existing geo-data.ts to preserve utility functions
  const geoDataPath = path.join(__dirname, "..", "src", "lib", "geo-data.ts")
  const existingContent = fs.readFileSync(geoDataPath, "utf-8")

  // Find where utility functions start (after the ZONE_GEOJSON closing)
  const utilStart = existingContent.indexOf(
    "/** Compute centroid of a zone polygon",
  )
  const utilFunctions =
    utilStart !== -1 ? existingContent.slice(utilStart) : ""

  const tsContent = `/**
 * GeoJSON polygons for Tijuana zones.
 * Generated by scripts/fetch-polygons.ts from OpenStreetMap data.
 * Coordinates in GeoJSON standard [lng, lat] order.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ZONE_GEOJSON: GeoJSON.FeatureCollection = ${jsonStr} as any

${utilFunctions}`

  fs.writeFileSync(geoDataPath, tsContent, "utf-8")
  console.log(`\nWritten to ${geoDataPath}`)
  console.log(`Total features: ${features.length}`)
}

main().catch(console.error)
