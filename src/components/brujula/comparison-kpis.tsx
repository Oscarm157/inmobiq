"use client"

import type { ValuationResult } from "@/types/database"

interface Props {
  result: ValuationResult
  priceMxn: number
}

function formatMxn(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-2xl font-black ${accent ?? "text-slate-800 dark:text-slate-100"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

export function ComparisonKpis({ result: r, priceMxn }: Props) {
  const premiumColor =
    r.price_premium_pct < -10
      ? "text-emerald-600 dark:text-emerald-400"
      : r.price_premium_pct > 10
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400"

  const trendColor =
    r.price_trend_pct > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : r.price_trend_pct < 0
        ? "text-red-600 dark:text-red-400"
        : undefined

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Precio/m²"
        value={`${formatMxn(r.price_per_m2)}/m²`}
        sub={`Zona: ${formatMxn(r.zone_avg_price_per_m2)}/m²`}
        accent={premiumColor}
      />
      <KpiCard
        label="Percentil"
        value={`${r.price_percentile}`}
        sub={`De 100, ${r.price_percentile} son más baratas`}
      />
      <KpiCard
        label="Tendencia"
        value={`${r.price_trend_pct > 0 ? "+" : ""}${r.price_trend_pct.toFixed(1)}%`}
        sub="Cambio semanal en zona"
        accent={trendColor}
      />
      <KpiCard
        label="Liquidez"
        value={`${r.liquidity_score}/100`}
        sub={r.liquidity_score >= 70 ? "Alta — fácil reventa" : r.liquidity_score <= 30 ? "Baja — reventa lenta" : "Media"}
      />
    </div>
  )
}
