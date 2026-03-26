"use client"

import type { ValuationVerdict, PropertyType, ListingType } from "@/types/database"

const ZONES = [
  { key: "muy_cara", label: "Muy cara", from: 0, to: 20, color: "bg-red-500" },
  { key: "cara", label: "Cara", from: 20, to: 40, color: "bg-orange-400" },
  { key: "precio_justo", label: "Justo", from: 40, to: 60, color: "bg-amber-400" },
  { key: "barata", label: "Barata", from: 60, to: 80, color: "bg-green-400" },
  { key: "muy_barata", label: "Muy barata", from: 80, to: 100, color: "bg-emerald-500" },
] as const

const VERDICT_ACCENT: Record<ValuationVerdict, string> = {
  muy_barata: "text-emerald-600 dark:text-emerald-400",
  barata: "text-green-600 dark:text-green-400",
  precio_justo: "text-amber-600 dark:text-amber-400",
  cara: "text-orange-600 dark:text-orange-400",
  muy_cara: "text-red-600 dark:text-red-400",
}

const VERDICT_LABEL: Record<ValuationVerdict, string> = {
  muy_barata: "Muy barata",
  barata: "Barata",
  precio_justo: "Precio justo",
  cara: "Cara",
  muy_cara: "Muy cara",
}

const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Depto",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

function formatMxn(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

interface Props {
  score: number
  verdict: ValuationVerdict
  zoneName: string
  pricePerM2: number
  zoneAvgPerM2: number
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    bedrooms: number | null
    bathrooms: number | null
  }
}

export function ScoreSlider({ score, verdict, zoneName, pricePerM2, zoneAvgPerM2, property }: Props) {
  // Clamp score position to 2-98 so pin doesn't overflow
  const pinPosition = Math.max(2, Math.min(98, score))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 card-shadow border border-slate-100 dark:border-slate-800">
      {/* Score + Verdict header */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className={`text-4xl font-black ${VERDICT_ACCENT[verdict]}`}>{score}</span>
        <span className={`text-lg font-bold ${VERDICT_ACCENT[verdict]}`}>{VERDICT_LABEL[verdict]}</span>
        <span className="text-sm text-slate-400 font-medium ml-auto">{zoneName}</span>
      </div>

      {/* Slider bar */}
      <div className="relative mb-2">
        {/* Track */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {ZONES.map((z) => (
            <div key={z.key} className={`${z.color} flex-1`} />
          ))}
        </div>

        {/* Pin marker */}
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${pinPosition}%` }}
        >
          <div className="w-1 h-3 bg-slate-900 dark:bg-white rounded-full" />
          <div className="w-3 h-3 bg-slate-900 dark:bg-white rounded-full -mt-1 -ml-1 border-2 border-white dark:border-slate-900" />
        </div>
      </div>

      {/* Labels under track */}
      <div className="flex text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-4">
        {ZONES.map((z) => (
          <span key={z.key} className="flex-1 text-center">{z.label}</span>
        ))}
      </div>

      {/* Property summary + price comparison */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="font-bold text-slate-700 dark:text-slate-200">
          {TYPE_LABELS[property.property_type]} en {property.listing_type}
        </span>
        <span className="text-slate-500">{formatMxn(property.price_mxn)}</span>
        <span className="text-slate-500">{property.area_m2} m²</span>
        {property.bedrooms != null && <span className="text-slate-500">{property.bedrooms} rec</span>}
        {property.bathrooms != null && <span className="text-slate-500">{property.bathrooms} ba</span>}
        <span className="ml-auto font-bold text-slate-700 dark:text-slate-200">
          {formatMxn(pricePerM2)}/m²
        </span>
        <span className="text-slate-400 text-xs">
          zona: {formatMxn(zoneAvgPerM2)}/m²
        </span>
      </div>
    </div>
  )
}
