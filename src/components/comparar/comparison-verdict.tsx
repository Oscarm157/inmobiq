"use client"

import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics, PropertyType } from "@/types/database"

interface ComparisonVerdictProps {
  zones: ZoneMetrics[]
  colors: string[]
}

interface MetricWin {
  metric: string
  zone: ZoneMetrics
  color: string
}

/** Shannon entropy normalized to 0-1 */
function shannonDiversity(counts: Record<PropertyType, number>): number {
  const values = Object.values(counts).filter((v) => v > 0)
  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0 || values.length <= 1) return 0
  const maxEntropy = Math.log(values.length)
  const entropy = -values.reduce((s, v) => {
    const p = v / total
    return s + p * Math.log(p)
  }, 0)
  return maxEntropy > 0 ? entropy / maxEntropy : 0
}

export function ComparisonVerdict({ zones, colors }: ComparisonVerdictProps) {
  const { formatPrice } = useCurrency()

  if (zones.length < 2) return null

  // Determine wins per metric
  const wins: MetricWin[] = []

  // Best (lowest) price/m²
  const bestPrice = zones.reduce((best, z) =>
    z.avg_price_per_m2 < best.avg_price_per_m2 ? z : best
  )
  wins.push({ metric: "mejor precio/m²", zone: bestPrice, color: colors[zones.indexOf(bestPrice)] })

  // Best trend
  const bestTrend = zones.reduce((best, z) =>
    z.price_trend_pct > best.price_trend_pct ? z : best
  )
  if (bestTrend.price_trend_pct !== 0) {
    wins.push({ metric: "mayor plusvalía", zone: bestTrend, color: colors[zones.indexOf(bestTrend)] })
  }

  // Most inventory
  const bestInv = zones.reduce((best, z) =>
    z.total_listings > best.total_listings ? z : best
  )
  wins.push({ metric: "mayor inventario", zone: bestInv, color: colors[zones.indexOf(bestInv)] })

  // Best (lowest) ticket
  const bestTicket = zones.reduce((best, z) =>
    z.avg_ticket < best.avg_ticket ? z : best
  )
  wins.push({ metric: "ticket más accesible", zone: bestTicket, color: colors[zones.indexOf(bestTicket)] })

  // Best diversity
  const bestDiv = zones.reduce((best, z) =>
    shannonDiversity(z.listings_by_type) > shannonDiversity(best.listings_by_type) ? z : best
  )
  wins.push({ metric: "mayor diversidad", zone: bestDiv, color: colors[zones.indexOf(bestDiv)] })

  // Count wins per zone
  const winCounts = new Map<string, { zone: ZoneMetrics; color: string; count: number; metrics: string[] }>()
  for (const w of wins) {
    const existing = winCounts.get(w.zone.zone_slug)
    if (existing) {
      existing.count++
      existing.metrics.push(w.metric)
    } else {
      winCounts.set(w.zone.zone_slug, { zone: w.zone, color: w.color, count: 1, metrics: [w.metric] })
    }
  }

  // Sort by wins descending
  const ranked = [...winCounts.values()].sort((a, b) => b.count - a.count)
  const leader = ranked[0]

  // Price difference between most/least expensive
  const prices = zones.map((z) => z.avg_price_per_m2).sort((a, b) => a - b)
  const priceDiffPct = prices.length >= 2
    ? Math.round(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100)
    : 0

  return (
    <div className="relative rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-6 shadow-sm overflow-hidden">
      {/* Subtle decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 dark:bg-blue-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative space-y-4">
        {/* Leader headline */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: leader.color + "18", color: leader.color }}
          >
            <Icon name="emoji_events" className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              <span style={{ color: leader.color }}>{leader.zone.zone_name}</span>
              {" "}destaca en {leader.count} de {wins.length} métricas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {leader.metrics.join(", ")}
              {priceDiffPct > 0 && (
                <span className="ml-1">
                  · Diferencia de precio entre zonas: {priceDiffPct}%
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Zone win badges */}
        <div className="flex flex-wrap gap-2">
          {ranked.map((r) => (
            <div
              key={r.zone.zone_slug}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {r.zone.zone_name}
              </span>
              <span
                className="text-xs font-black px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: r.color + "18", color: r.color }}
              >
                {r.count} ★
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
