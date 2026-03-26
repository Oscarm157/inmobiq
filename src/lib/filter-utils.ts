/**
 * Shared filter utilities — pure functions for URL ↔ FilterState conversion.
 * Extracted from market-filters.tsx for testability.
 */

import type { PropertyType, ListingType } from "@/types/database"
import type { PropertyCategory } from "@/lib/data/normalize"

export const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "casa", label: "Casa", icon: "home" },
  { value: "departamento", label: "Depto", icon: "apartment" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
  { value: "local", label: "Local", icon: "store" },
  { value: "oficina", label: "Oficina", icon: "business" },
]

export const ZONES = [
  { slug: "agua-caliente", name: "Agua Caliente" },
  { slug: "baja-malibu", name: "Baja Malibú" },
  { slug: "cacho", name: "Cacho-Cumbres" },
  { slug: "centro", name: "Centro" },
  { slug: "cerro-colorado", name: "Cerro Colorado" },
  { slug: "colinas-de-california", name: "Colinas de California" },
  { slug: "costa-coronado", name: "Costa Coronado" },
  { slug: "el-florido", name: "El Florido" },
  { slug: "el-lago-cucapah", name: "El Lago-Cucapah" },
  { slug: "hipodromo-chapultepec", name: "Hipódromo-Chapultepec" },
  { slug: "insurgentes", name: "Insurgentes" },
  { slug: "la-mesa", name: "La Mesa" },
  { slug: "las-americas", name: "Las Américas" },
  { slug: "libertad", name: "Libertad" },
  { slug: "lomas-de-agua-caliente", name: "Lomas de Agua Caliente" },
  { slug: "lomas-virreyes", name: "Lomas Virreyes" },
  { slug: "natura", name: "Natura" },
  { slug: "otay", name: "Otay" },
  { slug: "otay-universidad", name: "Otay Universidad" },
  { slug: "playas-de-tijuana", name: "Playas de Tijuana" },
  { slug: "punta-bandera", name: "Punta Bandera" },
  { slug: "real-del-mar", name: "Real del Mar" },
  { slug: "san-antonio-del-mar", name: "San Antonio del Mar" },
  { slug: "santa-fe", name: "Santa Fe" },
  { slug: "soler", name: "Mirador-Soler" },
  { slug: "terrazas-de-la-presa", name: "Terrazas de la Presa" },
  { slug: "zona-este", name: "Zona Este" },
  { slug: "zona-rio", name: "Zona Río" },
  // Catch-all
  { slug: "otros", name: "Otros" },
]

export const BEDROOMS = [1, 2, 3, 4] as const

export interface MarketFilterState {
  tipos: PropertyType[]
  zonas: string[]
  listing_type: ListingType | ""
  categoria: PropertyCategory | ""  // "residencial" | "comercial" | "terreno"
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
  if (state.categoria) p.set("categoria", state.categoria)
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

  // Sanitize categoria
  const rawCat = sp.get("categoria")
  const categoria: PropertyCategory | "" = rawCat === "residencial" || rawCat === "comercial" || rawCat === "terreno" ? rawCat : ""

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
    categoria,
    precio_min: sanitizeNum(sp.get("precio_min")),
    precio_max: sanitizeNum(sp.get("precio_max")),
    area_min: sanitizeNum(sp.get("area_min")),
    area_max: sanitizeNum(sp.get("area_max")),
    recamaras,
  }
}

interface FilterDefaults {
  listing_type?: string
  categoria?: string
}

export function hasActiveFilters(state: MarketFilterState, defaults?: FilterDefaults) {
  const defOp = defaults?.listing_type ?? ""
  const defCat = defaults?.categoria ?? ""
  return (
    state.tipos.length > 0 ||
    state.zonas.length > 0 ||
    (state.listing_type !== "" && state.listing_type !== defOp) ||
    (state.categoria !== "" && state.categoria !== defCat) ||
    state.precio_min !== "" ||
    state.precio_max !== "" ||
    state.area_min !== "" ||
    state.area_max !== "" ||
    state.recamaras.length > 0
  )
}

export function countActiveFilters(state: MarketFilterState, defaults?: FilterDefaults) {
  const defOp = defaults?.listing_type ?? ""
  const defCat = defaults?.categoria ?? ""
  return (
    state.tipos.length +
    state.zonas.length +
    (state.listing_type && state.listing_type !== defOp ? 1 : 0) +
    (state.categoria && state.categoria !== defCat ? 1 : 0) +
    (state.precio_min || state.precio_max ? 1 : 0) +
    (state.area_min || state.area_max ? 1 : 0) +
    state.recamaras.length
  )
}
