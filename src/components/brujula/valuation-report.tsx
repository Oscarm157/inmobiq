"use client"

import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"
import { ScoreSlider } from "./score-slider"
import { PricePositionChart } from "./price-position-chart"
import { ZoneProfileCard } from "./zone-profile-card"
import { AreaByTypeChart } from "@/components/zone/area-by-type-chart"
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

      {/* ── 2. Scorecard Analysis ── */}
      <AnalysisScorecard result={result} narrative={narrative} property={property} />

      {/* ── 3. Comparison table — full width ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Tu propiedad vs promedio de zona</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-1.5 text-[10px] font-bold text-slate-400 uppercase"></th>
              <th className="text-right py-1.5 text-[10px] font-bold text-blue-500 uppercase">Tu propiedad</th>
              <th className="text-right py-1.5 text-[10px] font-bold text-slate-400 uppercase">Zona</th>
              <th className="text-right py-1.5 text-[10px] font-bold text-slate-400 uppercase">Diferencia</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            <tr className="border-b border-slate-50 dark:border-slate-800">
              <td className="py-2 font-medium text-xs">Precio/m²</td>
              <td className="py-2 text-right font-bold text-xs">{formatMxn(result.price_per_m2)}</td>
              <td className="py-2 text-right text-xs">{formatMxn(result.zone_avg_price_per_m2)}</td>
              <td className={`py-2 text-right font-bold text-xs ${result.price_premium_pct > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {result.price_premium_pct > 0 ? "+" : ""}{result.price_premium_pct.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b border-slate-50 dark:border-slate-800">
              <td className="py-2 font-medium text-xs">Precio total</td>
              <td className="py-2 text-right font-bold text-xs">{formatMxn(property.price_mxn)}</td>
              <td className="py-2 text-right text-xs">{formatMxn(result.zone_avg_ticket)}</td>
              <td className={`py-2 text-right font-bold text-xs ${result.ticket_premium_pct > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {result.ticket_premium_pct > 0 ? "+" : ""}{result.ticket_premium_pct.toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium text-xs">Superficie</td>
              <td className="py-2 text-right font-bold text-xs">{property.area_m2} m²</td>
              <td className="py-2 text-right text-xs">{result.zone_avg_area > 0 ? `${result.zone_avg_area} m²` : "—"}</td>
              <td className={`py-2 text-right font-bold text-xs ${result.area_vs_zone_avg_pct > 0 ? "text-emerald-500" : "text-red-500"}`}>
                {result.area_vs_zone_avg_pct > 0 ? "+" : ""}{result.area_vs_zone_avg_pct.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 4. Zone Profile — full width, 3 columns ── */}
      <ZoneProfileCard result={result} />

      {/* ── 5. Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PricePositionChart distribution={result.zone_price_distribution} />
        {result.area_by_type?.length > 0 && (
          <AreaByTypeChart data={result.area_by_type} zoneName={result.zone_name} />
        )}
      </div>
    </div>
  )
}

// ── Scorecard Analysis Component ──

function dotColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[1]) return "bg-red-500"
  if (value >= thresholds[0]) return "bg-amber-400"
  return "bg-emerald-500"
}

function dotColorInverse(value: number, thresholds: [number, number]): string {
  if (value <= thresholds[0]) return "bg-red-500"
  if (value <= thresholds[1]) return "bg-amber-400"
  return "bg-emerald-500"
}

function AnalysisScorecard({ result: r, narrative, property }: { result: ValuationResult; narrative: string; property: Props["property"] }) {
  const premiumDot = r.price_premium_pct > 15 ? "bg-red-500" : r.price_premium_pct > 5 ? "bg-amber-400" : r.price_premium_pct < -5 ? "bg-emerald-500" : "bg-amber-400"

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl card-shadow border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 ${VERDICT_BG[r.verdict]} border-b border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" className={`text-base ${VERDICT_ACCENT[r.verdict]}`} />
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Analisis de Valuacion
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{r.zone_name}</span>
        </div>
      </div>

      {/* Scorecard row 1: Tu propiedad */}
      <div className="px-4 pt-2 pb-0">
        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Tu propiedad</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        <ScorecardCell
          label="Precio/m²"
          value={formatMxnShort(r.price_per_m2)}
          sub={`${r.price_premium_pct > 0 ? "+" : ""}${r.price_premium_pct.toFixed(1)}% vs zona`}
          dot={premiumDot}
        />
        <ScorecardCell
          label="Percentil"
          value={`${r.price_percentile}`}
          sub={`más caro que ${r.price_percentile}%`}
          dot={r.price_percentile >= 75 ? "bg-red-500" : r.price_percentile >= 50 ? "bg-amber-400" : "bg-emerald-500"}
        />
        <ScorecardCell
          label="Zona: inventario"
          value={`${r.zone_total_listings}`}
          sub={r.zone_total_listings < 20 ? "bajo" : r.zone_total_listings < 50 ? "medio" : "alto"}
          dot={dotColorInverse(r.zone_total_listings, [15, 30])}
        />
        <ScorecardCell
          label="Zona: tendencia"
          value={`${r.price_trend_pct > 0 ? "+" : ""}${r.price_trend_pct.toFixed(1)}%`}
          sub="semanal"
        />
      </div>

      {/* Scorecard row 2: Zona — riesgo e inversion */}
      <div className="px-4 pt-2 pb-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Zona: riesgo e inversion</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        {r.cap_rate != null && (
          <ScorecardCell
            label="Cap Rate"
            value={`${r.cap_rate.toFixed(1)}%`}
            sub={r.cap_rate >= 7 ? "atractivo" : r.cap_rate >= 5 ? "moderado" : "bajo"}
            dot={dotColorInverse(r.cap_rate, [5, 7])}
          />
        )}
        <ScorecardCell
          label="Riesgo"
          value={`${r.risk_score ?? 0}/100`}
          sub={r.risk_label ?? ""}
          dot={dotColor(r.risk_score ?? 0, [40, 65])}
        />
        <ScorecardCell
          label="Liquidez"
          value={`${r.liquidity_score ?? 0}/100`}
          sub={r.liquidity_score >= 70 ? "facil reventa" : r.liquidity_score >= 40 ? "reventa moderada" : "reventa lenta"}
          dot={dotColorInverse(r.liquidity_score ?? 0, [30, 60])}
        />
      </div>

      {/* AI Conclusion paragraph */}
      {narrative && (
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {renderNarrative(narrative)}
          </p>
        </div>
      )}
    </div>
  )
}

function ScorecardCell({ label, value, sub, dot }: { label: string; value: string; sub: string; dot?: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{value}</span>
        {dot && <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />}
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
    </div>
  )
}
