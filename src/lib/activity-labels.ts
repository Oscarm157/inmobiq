// ─── Umbrales configurables ───
const CITY_THRESHOLDS = { high: 500, medium: 200, low: 50 }
const ZONE_THRESHOLDS = { high: 150, medium: 50, low: 10 }

/**
 * Ciudad: label cualitativo para el total de listings a nivel ciudad
 */
export function getCityActivityLabel(totalListings: number): string {
  if (totalListings >= CITY_THRESHOLDS.high) return "Mercado Muy Activo"
  if (totalListings >= CITY_THRESHOLDS.medium) return "Mercado Activo"
  if (totalListings >= CITY_THRESHOLDS.low) return "Mercado en Crecimiento"
  return "Mercado Emergente"
}

/**
 * Zona: label cualitativo para el total de listings de una zona
 */
export function getZoneActivityLabel(totalListings: number): string {
  if (totalListings >= ZONE_THRESHOLDS.high) return "Alta actividad"
  if (totalListings >= ZONE_THRESHOLDS.medium) return "Actividad moderada"
  if (totalListings >= ZONE_THRESHOLDS.low) return "Actividad baja"
  return "Datos limitados"
}

/**
 * Tipo: presencia relativa de un tipo de propiedad dentro de una zona
 */
export function getTypePresenceLabel(
  typeCount: number,
  totalListings: number,
): string {
  if (totalListings === 0) return "Limitado"
  const pct = (typeCount / totalListings) * 100
  if (pct >= 50) return "Dominante"
  if (pct >= 25) return "Significativo"
  if (pct >= 10) return "Presente"
  return "Limitado"
}

/**
 * Para narrativas: frase descriptiva de actividad (minúsculas, para insertar en texto)
 */
export function describeActivity(totalListings: number): string {
  if (totalListings >= ZONE_THRESHOLDS.high)
    return "alta actividad inmobiliaria"
  if (totalListings >= ZONE_THRESHOLDS.medium) return "actividad moderada"
  return "actividad limitada"
}
