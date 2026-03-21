/**
 * Shared filter utilities — pure functions for URL ↔ FilterState conversion.
 * Extracted from market-filters.tsx for testability.
 */

import type { PropertyType, ListingType } from "@/types/database"

export const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "casa", label: "Casa", icon: "home" },
  { value: "departamento", label: "Depto", icon: "apartment" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
  { value: "local", label: "Local", icon: "store" },
  { value: "oficina", label: "Oficina", icon: "business" },
]

export const ZONES = [
  // Premium/Central
  { slug: "zona-rio", name: "Zona Río" },
  { slug: "cacho", name: "Cacho" },
  { slug: "chapultepec", name: "Chapultepec" },
  { slug: "hipodromo", name: "Hipódromo" },
  { slug: "agua-caliente", name: "Agua Caliente" },
  { slug: "lomas-de-agua-caliente", name: "Lomas de Agua Caliente" },
  // Frontera/Norte
  { slug: "centro", name: "Centro" },
  { slug: "libertad", name: "Libertad" },
  { slug: "soler", name: "Soler" },
  { slug: "federal", name: "Federal" },
  // Costa
  { slug: "playas-de-tijuana", name: "Playas de Tijuana" },
  { slug: "baja-malibu", name: "Baja Malibú" },
  { slug: "real-del-mar", name: "Real del Mar" },
  { slug: "san-antonio-del-mar", name: "San Antonio del Mar" },
  { slug: "punta-bandera", name: "Punta Bandera" },
  { slug: "costa-coronado", name: "Costa Coronado" },
  // Este
  { slug: "otay", name: "Otay" },
  { slug: "la-mesa", name: "La Mesa" },
  { slug: "las-americas", name: "Las Américas" },
  { slug: "villa-fontana", name: "Villa Fontana" },
  { slug: "montecarlo", name: "Montecarlo" },
  { slug: "otay-universidad", name: "Otay Universidad" },
  // Sur/Residencial
  { slug: "residencial-del-bosque", name: "Residencial del Bosque" },
  { slug: "santa-fe", name: "Santa Fe" },
  { slug: "natura", name: "Natura" },
  { slug: "colinas-de-california", name: "Colinas de California" },
  { slug: "lomas-virreyes", name: "Lomas Virreyes" },
  { slug: "insurgentes", name: "Insurgentes" },
  // Periférico
  { slug: "el-florido", name: "El Florido" },
  { slug: "terrazas-de-la-presa", name: "Terrazas de la Presa" },
  // Catch-all
  { slug: "otros", name: "Otros" },
]

export const BEDROOMS = [1, 2, 3, 4] as const

export interface MarketFilterState {
  tipos: PropertyType[]
  zonas: string[]
  listing_type: ListingType | ""
  precio_min: string
  precio_max: string
  area_min: string
  area_max: string
  recamaras: number[]
}

/** Valid property types for input sanitization */
const VALID_TYPES = new Set<string>(PROPERTY_TYPES.map((p) => p.value))
const VALID_ZONE_SLUGS = new Set<string>(ZONES.map((z) => z.slug))

export function buildMarketParams(state: MarketFilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (state.tipos.length) p.set("tipo", state.tipos.join(","))
  if (state.zonas.length) p.set("zona", state.zonas.join(","))
  if (state.listing_type) p.set("operacion", state.listing_type)
  if (state.precio_min) p.set("precio_min", state.precio_min)
  if (state.precio_max) p.set("precio_max", state.precio_max)
  if (state.area_min) p.set("area_min", state.area_min)
  if (state.area_max) p.set("area_max", state.area_max)
  if (state.recamaras.length) p.set("rec", state.recamaras.join(","))
  return p
}

export function parseMarketParams(sp: URLSearchParams): MarketFilterState {
  // Sanitize tipos: only allow known property types
  const rawTipos = sp.get("tipo")?.split(",") ?? []
  const tipos = rawTipos.filter((t) => VALID_TYPES.has(t)) as PropertyType[]

  // Sanitize zonas: only allow known zone slugs
  const rawZonas = sp.get("zona")?.split(",") ?? []
  const zonas = rawZonas.filter((z) => VALID_ZONE_SLUGS.has(z))

  // Sanitize listing_type
  const rawOp = sp.get("operacion")
  const listing_type: ListingType | "" = rawOp === "venta" || rawOp === "renta" ? rawOp : ""

  // Sanitize numeric strings (reject non-numeric values)
  const sanitizeNum = (val: string | null): string => {
    if (!val) return ""
    const n = Number(val)
    return !isNaN(n) && n >= 0 ? val : ""
  }

  // Sanitize recamaras: only allow valid values 1-4
  const rawRec = sp.get("rec")?.split(",").map(Number) ?? []
  const recamaras = rawRec.filter((n) => !isNaN(n) && n >= 1 && n <= 4)

  return {
    tipos,
    zonas,
    listing_type,
    precio_min: sanitizeNum(sp.get("precio_min")),
    precio_max: sanitizeNum(sp.get("precio_max")),
    area_min: sanitizeNum(sp.get("area_min")),
    area_max: sanitizeNum(sp.get("area_max")),
    recamaras,
  }
}

export function hasActiveFilters(state: MarketFilterState) {
  return (
    state.tipos.length > 0 ||
    state.zonas.length > 0 ||
    state.listing_type !== "" ||
    state.precio_min !== "" ||
    state.precio_max !== "" ||
    state.area_min !== "" ||
    state.area_max !== "" ||
    state.recamaras.length > 0
  )
}

export function countActiveFilters(state: MarketFilterState) {
  return (
    state.tipos.length +
    state.zonas.length +
    (state.listing_type ? 1 : 0) +
    (state.precio_min || state.precio_max ? 1 : 0) +
    (state.area_min || state.area_max ? 1 : 0) +
    state.recamaras.length
  )
}
