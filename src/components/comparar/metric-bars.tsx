"use client"

import { useCurrency } from "@/contexts/currency-context"
import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import type { ZoneMetrics } from "@/types/database"

interface MetricBarsProps {
  zones: ZoneMetrics[]
  colors: string[]
}

interface MetricDef {
  key: string
  label: string
  getValue: (z: ZoneMetrics) => number
  format: (v: number, formatPrice: (n: number) => string) => string
  higherIsBetter: boolean
}

const METRICS: MetricDef[] = [
  {
    key: "price_m2",
    label: "Precio / m²",
    getValue: (z) => z.avg_price_per_m2,
    format: (v, fp) => fp(v),
    higherIsBetter: false,
  },
  {
    key: "trend",
    label: "Tendencia",
    getValue: (z) => z.price_trend_pct,
    format: (v) => (v === 0 ? "Acumulando" : formatPercent(v)),
    higherIsBetter: true,
  },
  {
    key: "inventory",
    label: "Inventario",
    getValue: (z) => z.total_listings,
    format: (v) => getZoneActivityLabel(v),
    higherIsBetter: true,
  },
  {
    key: "ticket",
    label: "Ticket promedio",
    getValue: (z) => z.avg_ticket,
    format: (v, fp) => fp(v),
    higherIsBetter: false,
  },
]

export function MetricBars({ zones, colors }: MetricBarsProps) {
  const { formatPrice } = useCurrency()

  if (zones.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
      {METRICS.map((metric) => {
        const values = zones.map((z) => metric.getValue(z))
        const maxVal = Math.max(...values.map(Math.abs))
        const bestVal = metric.higherIsBetter
          ? Math.max(...values)
          : Math.min(...values)

        return (
          <div key={metric.key}>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
              {metric.label}
            </p>
            <div className="space-y-1.5">
              {zones.map((zone, i) => {
                const val = values[i]
                const isBest = val === bestVal
                const barWidth = maxVal > 0 ? Math.max(4, (Math.abs(val) / maxVal) * 100) : 4

                return (
                  <div key={zone.zone_slug} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-28 truncate flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colors[i] }}
                      />
                      {zone.zone_name}
                    </span>
                    <div className="flex-1 h-6 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: colors[i],
                          opacity: isBest ? 0.85 : 0.4,
                        }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold w-28 text-right ${
                        isBest
                          ? "text-slate-800 dark:text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {metric.format(val, formatPrice)}
                      {isBest && <span className="ml-1 text-xs text-amber-500">★</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
