/**
 * Rental attribute extraction — parse structured raw_data and description text
 * to surface rental-specific attributes (furnished, maintenance, deposit, etc.)
 *
 * Operates on the Listing interface at query time. Pure functions, no DB calls.
 * Three-layer extraction: structured raw_data > description regex > title hints.
 */

import type { Listing, SourcePortal } from "@/types/database"

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface RentalAttributes {
  is_furnished: boolean | null
  maintenance_fee: number | null     // monthly MXN
  deposit_months: number | null
  lease_term_months: number | null
  pets_allowed: boolean | null
  currency_listed: "MXN" | "USD" | null
  amenities: string[]
  is_short_term: boolean | null
  utilities_included: boolean | null
}

export interface ZoneCurrencyMix {
  pctMxn: number
  pctUsd: number
  avgUsdPremiumPct: number | null   // % premium of USD-listed vs MXN-listed
}

/* ------------------------------------------------------------------ */
/*  Amenity canonical names                                            */
/* ------------------------------------------------------------------ */

const AMENITY_PATTERNS: [RegExp, string][] = [
  [/alberca|piscina|pool/i, "Alberca"],
  [/gimnas|gym|fitness/i, "Gimnasio"],
  [/elevador|ascensor|elevator/i, "Elevador"],
  [/seguridad|vigilancia|guardia|security|circuito\s*cerrado|cctv/i, "Seguridad 24/7"],
  [/roof\s*garden|rooftop|terraza\s*comun/i, "Roof Garden"],
  [/estacionamiento\s*techado|garage\s*techado/i, "Estacionamiento Techado"],
  [/[aá]reas?\s*comun(?:es)?|salon\s*de?\s*eventos/i, "Áreas Comunes"],
  [/cowork|co-work|oficina\s*comun/i, "Coworking"],
  [/jardin|garden(?!.*roof)/i, "Jardín"],
  [/lavanderi|laundry/i, "Lavandería"],
  [/bodega|storage/i, "Bodega"],
  [/pet\s*area|area\s*de?\s*mascotas/i, "Área de Mascotas"],
  [/juegos?\s*infantil|playground|kids/i, "Juegos Infantiles"],
  [/sauna|vapor|spa|jacuzzi/i, "Spa/Sauna"],
]

/* ------------------------------------------------------------------ */
/*  Regex patterns for description/title parsing                       */
/* ------------------------------------------------------------------ */

const FURNISHED_YES = /\b(amueblad[oa]|full(?:y)?\s*furnish|equipad[oa]|con\s*muebles)\b/i
const FURNISHED_NO = /\b(sin\s*(?:amueblar|muebles)|unfurnish|no\s*amueblad[oa])\b/i

const MAINTENANCE_AMOUNT = /mantenimiento[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i
const MAINTENANCE_INCLUDED = /mantenimiento\s*incluid[oa]/i

const DEPOSIT_MONTHS = /dep[oó]sit[oa]?\s*(?:de\s*)?([\d]+)\s*mes/i
const DEPOSIT_GENERIC = /dep[oó]sit[oa]?\s*(?:de\s*)?(?:un|1)\s*mes/i

const LEASE_TERM = /contrato\s*(?:de\s*)?([\d]+)\s*mes|plazo\s*m[ií]nimo\s*(?:de\s*)?([\d]+)\s*mes|([\d]+)\s*meses?\s*m[ií]nimo/i

const PETS_YES = /\b(mascotas?\s*(?:permitidas?|aceptadas?|bienvenidas?|si|sí)|pet\s*friendly|se\s*aceptan\s*mascotas?)\b/i
const PETS_NO = /\b(no\s*mascotas?|mascotas?\s*no|sin\s*mascotas?|no\s*pets?)\b/i

const UTILITIES_YES = /\b(servicios?\s*incluid[oa]s?|utilities?\s*included|luz\s*(?:y\s*)?agua\s*incluid[oa]s?|todo\s*incluid[oa])\b/i

const SHORT_TERM = /\b(temporal|corto\s*plazo|short[\s-]*term|airbnb|por\s*noche|por\s*d[ií]a|renta\s*vacacional|amueblad[oa]\s*temporal)\b/i

const USD_INDICATOR = /\b(d[oó]lar|usd|us\$|dlls?)\b/i

/* ------------------------------------------------------------------ */
/*  Layer 1: Structured raw_data extraction                            */
/* ------------------------------------------------------------------ */

function extractFromInmuebles24(rawData: Record<string, unknown>): Partial<RentalAttributes> {
  const result: Partial<RentalAttributes> = { amenities: [] }
  const features = rawData.main_features as Record<string, { label: string; value: string }> | undefined
  if (!features) return result

  for (const feat of Object.values(features)) {
    const label = feat.label?.toLowerCase() ?? ""
    const value = feat.value?.toLowerCase() ?? ""

    // Furnished
    if (label.includes("amueblad") || label.includes("equipad") || label.includes("furnish")) {
      result.is_furnished = value === "sí" || value === "si" || value === "yes" || value === "1" || value === "true"
    }

    // Maintenance
    if (label.includes("mantenimiento") || label.includes("maintenance") || label.includes("cuota")) {
      const n = parseFloat(feat.value.replace(/[^\d.]/g, ""))
      if (!isNaN(n) && n > 0) result.maintenance_fee = n
    }

    // Amenities from features
    for (const [pattern, name] of AMENITY_PATTERNS) {
      if (pattern.test(label) || pattern.test(value)) {
        if (!result.amenities!.includes(name)) result.amenities!.push(name)
      }
    }
  }

  // Also check description_normalized from raw
  const desc = rawData.description_normalized as string | undefined
  if (desc) {
    Object.assign(result, mergePartial(result, extractFromText(desc)))
  }

  return result
}

function extractFromMercadoLibre(rawData: Record<string, unknown>): Partial<RentalAttributes> {
  const result: Partial<RentalAttributes> = { amenities: [] }

  // raw_data shape: { source: "preloaded_state", raw: { ... } }
  const raw = rawData.raw as Record<string, unknown> | undefined
  const attributes = (raw?.attributes ?? rawData.attributes) as Array<{ id: string; value_name?: string; value?: string }> | undefined
  if (!attributes) return result

  for (const attr of attributes) {
    const id = String(attr.id ?? "").toLowerCase()
    const val = String(attr.value_name ?? attr.value ?? "").toLowerCase()

    if (id.includes("furnished") || id.includes("amueblad")) {
      result.is_furnished = val.includes("si") || val.includes("sí") || val.includes("yes") || val === "1"
    }

    if (id.includes("maintenance") || id.includes("mantenimiento")) {
      const n = parseFloat(val.replace(/[^\d.]/g, ""))
      if (!isNaN(n) && n > 0) result.maintenance_fee = n
    }

    if (id.includes("pet") || id.includes("mascota")) {
      result.pets_allowed = val.includes("si") || val.includes("sí") || val.includes("yes") || val.includes("allowed")
    }

    // Amenities
    for (const [pattern, name] of AMENITY_PATTERNS) {
      if (pattern.test(id) || pattern.test(val)) {
        if (!result.amenities!.includes(name)) result.amenities!.push(name)
      }
    }
  }

  return result
}

/* ------------------------------------------------------------------ */
/*  Layer 2: Description / title text parsing                          */
/* ------------------------------------------------------------------ */

function extractFromText(text: string): Partial<RentalAttributes> {
  const result: Partial<RentalAttributes> = { amenities: [] }

  // Furnished
  if (FURNISHED_NO.test(text)) result.is_furnished = false
  else if (FURNISHED_YES.test(text)) result.is_furnished = true

  // Maintenance
  const maintMatch = text.match(MAINTENANCE_AMOUNT)
  if (maintMatch) {
    const n = parseFloat(maintMatch[1].replace(/,/g, ""))
    if (!isNaN(n) && n >= 500 && n <= 20_000) result.maintenance_fee = n
  } else if (MAINTENANCE_INCLUDED.test(text)) {
    result.maintenance_fee = 0 // 0 means included in rent
  }

  // Deposit
  const depMatch = text.match(DEPOSIT_MONTHS)
  if (depMatch) {
    const months = parseInt(depMatch[1] || depMatch[2] || depMatch[3], 10)
    if (months >= 1 && months <= 6) result.deposit_months = months
  } else if (DEPOSIT_GENERIC.test(text)) {
    result.deposit_months = 1
  }

  // Lease term
  const leaseMatch = text.match(LEASE_TERM)
  if (leaseMatch) {
    const months = parseInt(leaseMatch[1] || leaseMatch[2] || leaseMatch[3], 10)
    if (months >= 1 && months <= 60) result.lease_term_months = months
  }

  // Pets
  if (PETS_NO.test(text)) result.pets_allowed = false
  else if (PETS_YES.test(text)) result.pets_allowed = true

  // Utilities
  if (UTILITIES_YES.test(text)) result.utilities_included = true

  // Short-term
  if (SHORT_TERM.test(text)) result.is_short_term = true

  // USD currency hint
  if (USD_INDICATOR.test(text)) result.currency_listed = "USD"

  // Amenities
  for (const [pattern, name] of AMENITY_PATTERNS) {
    if (pattern.test(text) && !result.amenities!.includes(name)) {
      result.amenities!.push(name)
    }
  }

  return result
}

/* ------------------------------------------------------------------ */
/*  Merge helpers                                                      */
/* ------------------------------------------------------------------ */

/** Merge b into a — structured data (a) wins over text parsing (b) for non-null fields */
function mergePartial(a: Partial<RentalAttributes>, b: Partial<RentalAttributes>): Partial<RentalAttributes> {
  return {
    is_furnished: a.is_furnished ?? b.is_furnished,
    maintenance_fee: a.maintenance_fee ?? b.maintenance_fee,
    deposit_months: a.deposit_months ?? b.deposit_months,
    lease_term_months: a.lease_term_months ?? b.lease_term_months,
    pets_allowed: a.pets_allowed ?? b.pets_allowed,
    currency_listed: a.currency_listed ?? b.currency_listed,
    amenities: [...new Set([...(a.amenities ?? []), ...(b.amenities ?? [])])],
    is_short_term: a.is_short_term ?? b.is_short_term,
    utilities_included: a.utilities_included ?? b.utilities_included,
  }
}

function toFull(partial: Partial<RentalAttributes>): RentalAttributes {
  return {
    is_furnished: partial.is_furnished ?? null,
    maintenance_fee: partial.maintenance_fee ?? null,
    deposit_months: partial.deposit_months ?? null,
    lease_term_months: partial.lease_term_months ?? null,
    pets_allowed: partial.pets_allowed ?? null,
    currency_listed: partial.currency_listed ?? null,
    amenities: partial.amenities ?? [],
    is_short_term: partial.is_short_term ?? null,
    utilities_included: partial.utilities_included ?? null,
  }
}

/* ------------------------------------------------------------------ */
/*  Main extraction function                                           */
/* ------------------------------------------------------------------ */

/**
 * Extract rental-specific attributes from a listing's raw_data and title.
 * Three-layer priority: structured raw_data > description regex > title hints.
 */
export function extractRentalAttributes(listing: Listing): RentalAttributes {
  let result: Partial<RentalAttributes> = { amenities: [] }

  // Layer 1: Structured raw_data (highest confidence)
  if (listing.raw_data) {
    const source = listing.source as SourcePortal
    if (source === "inmuebles24") {
      result = mergePartial(result, extractFromInmuebles24(listing.raw_data))
    } else if (source === "mercadolibre") {
      result = mergePartial(result, extractFromMercadoLibre(listing.raw_data))
    }
    // Lamudi and vivanuncios: fall through to text parsing
  }

  // Layer 2: Description text from raw_data (if not already parsed by portal adapter)
  const descFromRaw = listing.raw_data?.description_normalized as string | undefined
    ?? listing.raw_data?.description as string | undefined
  if (descFromRaw) {
    result = mergePartial(result, extractFromText(descFromRaw))
  }

  // Layer 3: Title (supplementary, lowest priority)
  if (listing.title) {
    result = mergePartial(result, extractFromText(listing.title))
  }

  // Currency from Listing interface
  if (listing.original_currency) {
    result.currency_listed = result.currency_listed ?? listing.original_currency
  }

  return toFull(result)
}

/* ------------------------------------------------------------------ */
/*  Batch extraction + aggregation                                     */
/* ------------------------------------------------------------------ */

/**
 * Extract rental attributes for all listings and return both individual
 * results and aggregate statistics for a zone.
 */
export function extractRentalAttributesBatch(listings: Listing[]): {
  attributes: Map<string, RentalAttributes>
  stats: RentalAttributeStats
} {
  const attributes = new Map<string, RentalAttributes>()
  const furnishedPrices: number[] = []
  const unfurnishedPrices: number[] = []
  let furnishedCount = 0
  let unfurnishedCount = 0
  let maintenanceFees: number[] = []
  let petsAllowed = 0
  let petsDisallowed = 0
  let shortTermCount = 0
  let utilitiesIncluded = 0
  let depositMonths: number[] = []
  const amenityCount = new Map<string, number>()

  for (const listing of listings) {
    const attrs = extractRentalAttributes(listing)
    attributes.set(listing.id, attrs)

    if (attrs.is_furnished === true) {
      furnishedCount++
      if (listing.price_per_m2 > 0) furnishedPrices.push(listing.price_per_m2)
    } else if (attrs.is_furnished === false) {
      unfurnishedCount++
      if (listing.price_per_m2 > 0) unfurnishedPrices.push(listing.price_per_m2)
    }

    if (attrs.maintenance_fee !== null && attrs.maintenance_fee > 0) {
      maintenanceFees.push(attrs.maintenance_fee)
    }

    if (attrs.pets_allowed === true) petsAllowed++
    else if (attrs.pets_allowed === false) petsDisallowed++

    if (attrs.is_short_term) shortTermCount++
    if (attrs.utilities_included) utilitiesIncluded++

    if (attrs.deposit_months !== null) depositMonths.push(attrs.deposit_months)

    for (const amenity of attrs.amenities) {
      amenityCount.set(amenity, (amenityCount.get(amenity) ?? 0) + 1)
    }
  }

  const avgFurnished = furnishedPrices.length > 0
    ? furnishedPrices.reduce((a, b) => a + b, 0) / furnishedPrices.length
    : null
  const avgUnfurnished = unfurnishedPrices.length > 0
    ? unfurnishedPrices.reduce((a, b) => a + b, 0) / unfurnishedPrices.length
    : null

  const furnishedPremiumPct = avgFurnished && avgUnfurnished && avgUnfurnished > 0
    ? ((avgFurnished - avgUnfurnished) / avgUnfurnished) * 100
    : null

  const medianMaintenance = maintenanceFees.length > 0
    ? maintenanceFees.sort((a, b) => a - b)[Math.floor(maintenanceFees.length / 2)]
    : null

  const medianDeposit = depositMonths.length > 0
    ? depositMonths.sort((a, b) => a - b)[Math.floor(depositMonths.length / 2)]
    : null

  // Top amenities sorted by frequency
  const topAmenities = [...amenityCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / listings.length) * 100) }))

  return {
    attributes,
    stats: {
      total: listings.length,
      furnishedCount,
      unfurnishedCount,
      unknownFurnishedCount: listings.length - furnishedCount - unfurnishedCount,
      furnishedPremiumPct,
      avgFurnishedPriceM2: avgFurnished,
      avgUnfurnishedPriceM2: avgUnfurnished,
      medianMaintenanceFee: medianMaintenance,
      maintenanceReported: maintenanceFees.length,
      petsAllowed,
      petsDisallowed,
      shortTermCount,
      longTermCount: listings.length - shortTermCount,
      utilitiesIncludedCount: utilitiesIncluded,
      medianDepositMonths: medianDeposit,
      topAmenities,
    },
  }
}

export interface RentalAttributeStats {
  total: number
  furnishedCount: number
  unfurnishedCount: number
  unknownFurnishedCount: number
  furnishedPremiumPct: number | null
  avgFurnishedPriceM2: number | null
  avgUnfurnishedPriceM2: number | null
  medianMaintenanceFee: number | null
  maintenanceReported: number
  petsAllowed: number
  petsDisallowed: number
  shortTermCount: number
  longTermCount: number
  utilitiesIncludedCount: number
  medianDepositMonths: number | null
  topAmenities: { name: string; count: number; pct: number }[]
}

/* ------------------------------------------------------------------ */
/*  Zone currency mix                                                  */
/* ------------------------------------------------------------------ */

/**
 * Compute the MXN/USD currency mix for rental listings in a zone.
 * Uses original_currency from the Listing interface.
 */
export function getZoneCurrencyMix(listings: Listing[]): ZoneCurrencyMix {
  if (listings.length === 0) return { pctMxn: 100, pctUsd: 0, avgUsdPremiumPct: null }

  let mxnCount = 0
  let usdCount = 0
  const mxnPricesM2: number[] = []
  const usdPricesM2: number[] = []

  for (const l of listings) {
    const currency = l.original_currency ?? "MXN"
    if (currency === "USD") {
      usdCount++
      if (l.price_per_m2 > 0) usdPricesM2.push(l.price_per_m2)
    } else {
      mxnCount++
      if (l.price_per_m2 > 0) mxnPricesM2.push(l.price_per_m2)
    }
  }

  const total = mxnCount + usdCount
  const avgMxn = mxnPricesM2.length > 0
    ? mxnPricesM2.reduce((a, b) => a + b, 0) / mxnPricesM2.length
    : null
  const avgUsd = usdPricesM2.length > 0
    ? usdPricesM2.reduce((a, b) => a + b, 0) / usdPricesM2.length
    : null

  const avgUsdPremiumPct = avgMxn && avgUsd && avgMxn > 0
    ? ((avgUsd - avgMxn) / avgMxn) * 100
    : null

  return {
    pctMxn: Math.round((mxnCount / total) * 100),
    pctUsd: Math.round((usdCount / total) * 100),
    avgUsdPremiumPct: avgUsdPremiumPct !== null ? Math.round(avgUsdPremiumPct * 10) / 10 : null,
  }
}
