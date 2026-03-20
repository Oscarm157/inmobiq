"use client"

import { formatPercent, formatNumber } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics, CityMetrics } from "@/types/database"

interface ZoneComparisonEnhancedProps {
  zone: ZoneMetrics
  city: CityMetrics
}

interface CompRow {
  label: string
  zoneValue: string
  cityValue: string
  zoneRaw: number
  cityRaw: number
}

export function ZoneComparisonEnhanced({ zone, city }: ZoneComparisonEnhancedProps) {
  const { formatPrice } = useCurrency()
  const rows: CompRow[] = [
    {
      label: "Precio / m²",
      zoneValue: formatPrice(zone.avg_price_per_m2),
      cityValue: formatPrice(city.avg_price_per_m2),
      zoneRaw: zone.avg_price_per_m2,
      cityRaw: city.avg_price_per_m2,
    },
    {
      label: "Ticket Promedio",
      zoneValue: formatPrice(zone.avg_ticket),
      cityValue: formatPrice(city.avg_price_per_m2 * 80), // rough city avg ticket
      zoneRaw: zone.avg_ticket,
      cityRaw: city.avg_price_per_m2 * 80,
    },
    {
      label: "Inventario",
      zoneValue: formatNumber(zone.total_listings),
      cityValue: formatNumber(city.total_listings),
      zoneRaw: zone.total_listings,
      cityRaw: city.total_listings,
    },
    {
      label: "Tendencia",
      zoneValue: formatPercent(zone.price_trend_pct),
      cityValue: formatPercent(city.price_trend_pct),
      zoneRaw: Math.abs(zone.price_trend_pct),
      cityRaw: Math.abs(city.price_trend_pct),
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
        Zona vs Ciudad
      </h4>

      <div className="space-y-4">
        {rows.map((row) => {
          const max = Math.max(row.zoneRaw, row.cityRaw, 1)
          const zonePct = Math.round((row.zoneRaw / max) * 100)
          const cityPct = Math.round((row.cityRaw / max) * 100)

          return (
            <div key={row.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {row.label}
              </p>

              {/* Zone bar */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 w-7">
                  Zona
                </span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${zonePct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[80px] text-right">
                  {row.zoneValue}
                </span>
              </div>

              {/* City bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 w-7">
                  Cd.
                </span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-300 dark:bg-slate-600 rounded-full transition-all duration-500"
                    style={{ width: `${cityPct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 min-w-[80px] text-right">
                  {row.cityValue}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
