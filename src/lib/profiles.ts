/**
 * User profile types and their default configurations.
 *
 * Each profile determines:
 * - Default filters (operacion + categoria)
 * - Default tab on zone page
 * - Which sections are prominent vs dimmed
 */

export type PerfilType = "comprador" | "vendedor" | "arrendador" | "broker"

export interface PerfilConfig {
  key: PerfilType
  label: string
  description: string
  icon: string // Material Symbol name
  defaultOperacion: "venta" | "renta"
  defaultCategoria: "residencial" | "comercial" | "terreno"
  defaultTab: string
  /** Section IDs that get a subtle highlight for this profile */
  prominentSections: string[]
  /** Section IDs that get reduced opacity for this profile */
  dimmedSections: string[]
}

export const PERFIL_CONFIGS: Record<PerfilType, PerfilConfig> = {
  comprador: {
    key: "comprador",
    label: "Comprador",
    description: "Quiero comprar una propiedad",
    icon: "home",
    defaultOperacion: "venta",
    defaultCategoria: "residencial",
    defaultTab: "general",
    prominentSections: ["editorial", "price-distribution", "zone-dna", "zone-comparison", "demographics"],
    dimmedSections: ["investment-kpis", "yield-chart", "expense-breakdown", "rental-market"],
  },
  vendedor: {
    key: "vendedor",
    label: "Vendedor",
    description: "Quiero vender mi propiedad",
    icon: "sell",
    defaultOperacion: "venta",
    defaultCategoria: "residencial",
    defaultTab: "precios",
    prominentSections: ["price-percentile", "price-distribution", "scatter", "zone-comparison", "trend"],
    dimmedSections: ["investment-kpis", "yield-chart", "expense-breakdown", "rental-market"],
  },
  arrendador: {
    key: "arrendador",
    label: "Inversionista / Arrendador",
    description: "Quiero invertir o rentar mi propiedad",
    icon: "trending_up",
    defaultOperacion: "renta",
    defaultCategoria: "residencial",
    defaultTab: "inversion",
    prominentSections: ["investment-kpis", "yield-chart", "expense-breakdown", "rental-market", "rental-insights"],
    dimmedSections: [],
  },
  broker: {
    key: "broker",
    label: "Broker / Profesional",
    description: "Soy agente inmobiliario o profesional del sector",
    icon: "business_center",
    defaultOperacion: "venta",
    defaultCategoria: "residencial",
    defaultTab: "general",
    prominentSections: [],
    dimmedSections: [],
  },
}

export const PERFIL_KEYS = Object.keys(PERFIL_CONFIGS) as PerfilType[]

/** Get config for a profile type, or null if invalid */
export function getPerfilConfig(perfil: string | null | undefined): PerfilConfig | null {
  if (!perfil) return null
  return PERFIL_CONFIGS[perfil as PerfilType] ?? null
}
