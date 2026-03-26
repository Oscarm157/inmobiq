"use client"

import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"
import { ScoreSlider } from "./score-slider"
import { PricePositionChart } from "./price-position-chart"
import { ZoneProfileCard } from "./zone-profile-card"
import { Icon } from "@/components/icon"

function formatMxn(n: number): string {
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
}

function formatMxnShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const VERDICT_ACCENT: Record<ValuationVerdict, string> = {
  muy_barata: "text-emerald-600 dark:text-emerald-400",
  barata: "text-green-600 dark:text-green-400",
  precio_justo: "text-amber-600 dark:text-amber-400",
  cara: "text-orange-600 dark:text-orange-400",
  muy_cara: "text-red-600 dark:text-red-400",
}

const VERDICT_BG: Record<ValuationVerdict, string> = {
  muy_barata: "bg-emerald-50 dark:bg-emerald-950/30",
  barata: "bg-green-50 dark:bg-green-950/30",
  precio_justo: "bg-amber-50 dark:bg-amber-950/30",
  cara: "bg-orange-50 dark:bg-orange-950/30",
  muy_cara: "bg-red-50 dark:bg-red-950/30",
}

interface Props {
  result: ValuationResult
  narrative: string
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    bedrooms: number | null
    bathrooms: number | null
    parking: number | null
    address: string | null
  }
}

/** Render markdown-lite: **bold** → <strong> */
function renderNarrative(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-800 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function ValuationReport({ result, narrative, property }: Props) {
  return (
    <div className="space-y-5">
      {/* ── 1. Score Slider + Property Summary ── */}
      <ScoreSlider
        score={result.score}
        verdict={result.verdict}
        zoneName={result.zone_name}
        pricePerM2={result.price_per_m2}
        zoneAvgPerM2={result.zone_avg_price_per_m2}
        property={property}
      />

      {/* ── 2. Narrative Analysis (right after slider) ── */}
      {narrative && <NarrativeSection narrative={narrative} verdict={result.verdict} reasons={result.verdict_reasons} />}

      {/* ── 3. Two-column layout: Price Analysis | Zone Profile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Price Analysis (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* KPIs row */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCompact
              label="Precio/m²"
              value={`${formatMxnShort(result.price_per_m2)}`}
              delta={`${result.price_premium_pct > 0 ? "+" : ""}${result.price_premium_pct.toFixed(1)}%`}
              deltaColor={result.price_premium_pct > 10 ? "text-red-500" : result.price_premium_pct < -10 ? "text-emerald-500" : "text-amber-500"}
            />
            <KpiCompact
              label="Percentil"
              value={`${result.price_percentile}`}
              delta={`de 100`}
            />
            <KpiCompact
              label="Tendencia"
              value={`${result.price_trend_pct > 0 ? "+" : ""}${result.price_trend_pct.toFixed(1)}%`}
              delta="semanal"
              deltaColor={result.price_trend_pct > 0 ? "text-emerald-500" : result.price_trend_pct < 0 ? "text-red-500" : undefined}
            />
          </div>

          {/* Comparison table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-1.5 text-[10px] font-bold text-slate-400 uppercase"></th>
                  <th className="text-right py-1.5 text-[10px] font-bold text-blue-500 uppercase">Propiedad</th>
                  <th className="text-right py-1.5 text-[10px] font-bold text-slate-400 uppercase">Zona</th>
                  <th className="text-right py-1.5 text-[10px] font-bold text-slate-400 uppercase">Dif.</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <td className="py-1.5 font-medium text-xs">Precio/m²</td>
                  <td className="py-1.5 text-right font-bold text-xs">{formatMxn(result.price_per_m2)}</td>
                  <td className="py-1.5 text-right text-xs">{formatMxn(result.zone_avg_price_per_m2)}</td>
                  <td className={`py-1.5 text-right font-bold text-xs ${result.price_premium_pct > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {result.price_premium_pct > 0 ? "+" : ""}{result.price_premium_pct.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <td className="py-1.5 font-medium text-xs">Precio total</td>
                  <td className="py-1.5 text-right font-bold text-xs">{formatMxn(property.price_mxn)}</td>
                  <td className="py-1.5 text-right text-xs">{formatMxn(result.zone_avg_ticket)}</td>
                  <td className="py-1.5 text-right text-xs text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-xs">Superficie</td>
                  <td className="py-1.5 text-right font-bold text-xs">{property.area_m2} m²</td>
                  <td className="py-1.5 text-right text-xs">—</td>
                  <td className={`py-1.5 text-right font-bold text-xs ${result.area_vs_zone_avg_pct > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {result.area_vs_zone_avg_pct > 0 ? "+" : ""}{result.area_vs_zone_avg_pct.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Price distribution */}
          <PricePositionChart distribution={result.zone_price_distribution} />
        </div>

        {/* Right: Zone Profile (2/5) */}
        <div className="lg:col-span-2">
          <ZoneProfileCard result={result} />
        </div>
      </div>

      {/* Verdict factors are now inside NarrativeSection as footer */}
    </div>
  )
}

function KpiCompact({ label, value, delta, deltaColor }: { label: string; value: string; delta: string; deltaColor?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 card-shadow border border-slate-100 dark:border-slate-800">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{value}</p>
      <p className={`text-[10px] font-bold ${deltaColor ?? "text-slate-400"}`}>{delta}</p>
    </div>
  )
}

const PARAGRAPH_ICONS = ["summarize", "analytics", "lightbulb"] as const

function NarrativeSection({ narrative, verdict, reasons }: { narrative: string; verdict: ValuationVerdict; reasons: string[] }) {
  const paragraphs = narrative.split("\n\n").filter((p) => p.trim())

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl card-shadow border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 ${VERDICT_BG[verdict]} border-b border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center gap-2">
          <Icon name="auto_awesome" className={`text-base ${VERDICT_ACCENT[verdict]}`} />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Analisis de Valuacion
          </h3>
        </div>
      </div>

      {/* Paragraphs as visual blocks */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {paragraphs.map((paragraph, i) => (
          <div key={i} className="flex gap-3 px-5 py-4">
            <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon
                name={PARAGRAPH_ICONS[i] ?? "article"}
                className="text-sm text-slate-400"
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
              {renderNarrative(paragraph)}
            </p>
          </div>
        ))}
      </div>

      {/* Factors as footer */}
      {reasons.length > 0 && (
        <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-medium text-slate-500 dark:text-slate-400"
              >
                <Icon name="check" className={`text-[10px] ${VERDICT_ACCENT[verdict]}`} />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
