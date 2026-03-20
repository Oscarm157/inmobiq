/**
 * GeoJSON polygons for Tijuana zones.
 * Approximate bounding polygons based on known centroid coordinates.
 * These will be replaced with precise polygons from DB once polygon_geojson
 * is populated in the migrations.
 */

export interface ZoneGeoJSON {
  slug: string
  name: string
  lat: number
  lng: number
  polygon: [number, number][] // [lat, lng] pairs
}

// Approximate polygons around each zone centroid (~1-2km radius)
export const TIJUANA_ZONE_GEO: ZoneGeoJSON[] = [
  {
    slug: "zona-rio",
    name: "Zona Río",
    lat: 32.5160,
    lng: -117.0350,
    polygon: [
      [32.526, -117.050],
      [32.526, -117.020],
      [32.506, -117.020],
      [32.506, -117.050],
    ],
  },
  {
    slug: "playas-de-tijuana",
    name: "Playas de Tijuana",
    lat: 32.5249,
    lng: -117.1234,
    polygon: [
      [32.538, -117.138],
      [32.538, -117.108],
      [32.511, -117.108],
      [32.511, -117.138],
    ],
  },
  {
    slug: "otay",
    name: "Otay",
    lat: 32.5330,
    lng: -116.9680,
    polygon: [
      [32.548, -116.983],
      [32.548, -116.953],
      [32.518, -116.953],
      [32.518, -116.983],
    ],
  },
  {
    slug: "chapultepec",
    name: "Chapultepec",
    lat: 32.5185,
    lng: -116.9905,
    polygon: [
      [32.530, -117.003],
      [32.530, -116.978],
      [32.507, -116.978],
      [32.507, -117.003],
    ],
  },
  {
    slug: "hipodromo",
    name: "Hipódromo",
    lat: 32.5035,
    lng: -116.9975,
    polygon: [
      [32.515, -117.010],
      [32.515, -116.985],
      [32.492, -116.985],
      [32.492, -117.010],
    ],
  },
  {
    slug: "centro",
    name: "Centro",
    lat: 32.5323,
    lng: -117.0350,
    polygon: [
      [32.544, -117.047],
      [32.544, -117.023],
      [32.520, -117.023],
      [32.520, -117.047],
    ],
  },
  {
    slug: "residencial-del-bosque",
    name: "Residencial del Bosque",
    lat: 32.4980,
    lng: -117.0050,
    polygon: [
      [32.510, -117.018],
      [32.510, -116.992],
      [32.486, -116.992],
      [32.486, -117.018],
    ],
  },
  {
    slug: "la-mesa",
    name: "La Mesa",
    lat: 32.5248,
    lng: -116.9634,
    polygon: [
      [32.537, -116.976],
      [32.537, -116.951],
      [32.512, -116.951],
      [32.512, -116.976],
    ],
  },
]

// Choropleth color scale based on price per m2
// Price range roughly 15k-45k MXN/m2
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

export const TIJUANA_CENTER: [number, number] = [32.515, -117.022]
export const TIJUANA_BOUNDS: [[number, number], [number, number]] = [
  [32.450, -117.180],
  [32.580, -116.900],
]
