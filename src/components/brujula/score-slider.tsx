"use client"

import type { ValuationVerdict, PropertyType, ListingType } from "@/types/database"
import { Icon } from "@/components/icon"

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
  muy_barata: "Muy barato",
  barata: "Barato",
  precio_justo: "Precio justo",
  cara: "Caro",
  muy_cara: "Muy caro",
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

  const features = [
    { icon: "payments", value: formatMxn(property.price_mxn) },
    { icon: "square_foot", value: `${property.area_m2} m²` },
    ...(property.bedrooms != null ? [{ icon: "bed", value: `${property.bedrooms}` }] : []),
    ...(property.bathrooms != null ? [{ icon: "shower", value: `${property.bathrooms}` }] : []),
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 card-shadow border border-slate-100 dark:border-slate-800">
      {/* Property title + features (ABOVE slider) */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {TYPE_LABELS[property.property_type]} en {property.listing_type}
            </h2>
            <p className="text-sm text-slate-400 font-medium">{zoneName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatMxn(pricePerM2)}/m²
            </p>
            <p className="text-xs text-slate-400">
              zona: {formatMxn(zoneAvgPerM2)}/m²
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <Icon name={f.icon} className="text-sm text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score + Verdict */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className={`text-4xl font-black ${VERDICT_ACCENT[verdict]}`}>{score}</span>
        <span className={`text-lg font-bold ${VERDICT_ACCENT[verdict]}`}>{VERDICT_LABEL[verdict]}</span>
      </div>

      {/* Slider bar */}
      <div className="relative mb-2">
        <div className="flex h-3 rounded-full overflow-hidden">
          {ZONES.map((z) => (
            <div key={z.key} className={`${z.color} flex-1`} />
          ))}
        </div>
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${pinPosition}%` }}
        >
          <div className="w-1 h-3 bg-slate-900 dark:bg-white rounded-full" />
          <div className="w-3 h-3 bg-slate-900 dark:bg-white rounded-full -mt-1 -ml-1 border-2 border-white dark:border-slate-900" />
        </div>
      </div>

      {/* Labels under track */}
      <div className="flex text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {ZONES.map((z) => (
          <span key={z.key} className="flex-1 text-center">{z.label}</span>
        ))}
      </div>
    </div>
  )
}
