/**
 * Generate corrected zone polygons for Tijuana zones.
 * Uses researched real centroids from Google Maps / web sources.
 * Outputs GeoJSON to paste into geo-data.ts.
 *
 * Run: npx tsx scripts/generate-polygons.ts
 */

interface ZoneDef {
  slug: string
  name: string
  center: [number, number] // [lng, lat]
  radiusLng: number // radius in longitude degrees
  radiusLat: number // radius in latitude degrees
  points: number // raw control points
}

// Corrected zone centroids based on research:
// - Zona Río: SKIP (real OSM polygon, do not regenerate)
// - Sources: Google Maps screenshots, Nominatim, pueblosamerica, 123coordenadas, etc.
const zones: ZoneDef[] = [
  // Playas de Tijuana - large coastal area west of TJ (current is okay, slight adjustment)
  { slug: "playas-de-tijuana", name: "Playas de Tijuana", center: [-117.122, 32.525], radiusLng: 0.020, radiusLat: 0.018, points: 14 },
  // Otay - near Garita de Otay / Airport, northeast TJ
  { slug: "otay", name: "Otay", center: [-116.945, 32.548], radiusLng: 0.018, radiusLat: 0.014, points: 12 },
  // Chapultepec - south of Blvd Agua Caliente, CP 22020 (Google Maps: near Club Campestre, Estadio)
  { slug: "chapultepec", name: "Chapultepec", center: [-117.008, 32.498], radiusLng: 0.012, radiusLat: 0.010, points: 11 },
  // Hipódromo - Agua Caliente area, near Estadio Caliente (32.506, -116.993)
  { slug: "hipodromo", name: "Hipódromo", center: [-116.995, 32.508], radiusLng: 0.012, radiusLat: 0.010, points: 11 },
  // Centro - Downtown TJ, Zona Centro, Av Revolución (~32.535, -117.040)
  { slug: "centro", name: "Centro", center: [-117.040, 32.535], radiusLng: 0.012, radiusLat: 0.010, points: 11 },
  // Residencial del Bosque - CP 22204, near Blvd 2000, southeastern TJ
  { slug: "residencial-del-bosque", name: "Residencial del Bosque", center: [-116.920, 32.470], radiusLng: 0.015, radiusLat: 0.012, points: 11 },
  // La Mesa - Delegación La Mesa, center ~32.501, -116.965
  { slug: "la-mesa", name: "La Mesa", center: [-116.965, 32.501], radiusLng: 0.014, radiusLat: 0.012, points: 12 },
  // Santa Fe - Villa Residencial Santa Fe, ~32.447, -117.042
  { slug: "santa-fe", name: "Santa Fe", center: [-117.042, 32.447], radiusLng: 0.014, radiusLat: 0.012, points: 11 },
  // San Antonio del Mar - coastal south, 32.424, -117.097
  { slug: "san-antonio-del-mar", name: "San Antonio del Mar", center: [-117.097, 32.424], radiusLng: 0.012, radiusLat: 0.012, points: 11 },
  // El Florido - far east TJ, 32.468, -116.868 (CP 22237)
  { slug: "el-florido", name: "El Florido", center: [-116.868, 32.468], radiusLng: 0.018, radiusLat: 0.016, points: 12 },
  // Terrazas de la Presa - near Presa Abelardo at 32.445, -116.910 (CP 22124)
  { slug: "terrazas-de-la-presa", name: "Terrazas de la Presa", center: [-116.910, 32.445], radiusLng: 0.012, radiusLat: 0.010, points: 11 },
]

/** Seeded random for reproducible organic shapes */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/** Generate organic polygon points around a center */
function generateOrganicPolygon(zone: ZoneDef): [number, number][] {
  const { center, radiusLng, radiusLat, points } = zone
  const seed = zone.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rawPoints: [number, number][] = []

  for (let i = 0; i < points; i++) {
    const angle = (2 * Math.PI * i) / points
    // Vary radius 0.75-1.15 for organic feel
    const rFactor = 0.75 + seededRandom(seed + i * 7) * 0.40
    const lng = center[0] + Math.cos(angle) * radiusLng * rFactor
    const lat = center[1] + Math.sin(angle) * radiusLat * rFactor
    rawPoints.push([
      Math.round(lng * 1000000) / 1000000,
      Math.round(lat * 1000000) / 1000000,
    ])
  }

  return rawPoints
}

/** Catmull-Rom spline interpolation for smoothing */
function catmullRomSmooth(points: [number, number][], segments = 5): [number, number][] {
  const n = points.length
  const result: [number, number][] = []

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]

    for (let t = 0; t < segments; t++) {
      const tt = t / segments
      const tt2 = tt * tt
      const tt3 = tt2 * tt

      const lng =
        0.5 * (
          (2 * p1[0]) +
          (-p0[0] + p2[0]) * tt +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * tt2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * tt3
        )
      const lat =
        0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * tt +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * tt2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * tt3
        )

      result.push([
        Math.round(lng * 1000000) / 1000000,
        Math.round(lat * 1000000) / 1000000,
      ])
    }
  }

  // Close the polygon
  result.push(result[0])
  return result
}

// Generate all polygons
const features = zones.map((zone, idx) => {
  const raw = generateOrganicPolygon(zone)
  const smoothed = catmullRomSmooth(raw, 5)
  return {
    type: "Feature" as const,
    id: idx + 1, // 0 is reserved for Zona Río
    properties: { slug: zone.slug, name: zone.name },
    geometry: {
      type: "Polygon" as const,
      coordinates: [smoothed],
    },
  }
})

// Output as JSON
console.log(JSON.stringify(features, null, 2))
