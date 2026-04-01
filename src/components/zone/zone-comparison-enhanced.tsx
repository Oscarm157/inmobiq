"use client"

import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel, getCityActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics, CityMetrics } from "@/types/database"
import { InfoTooltip } from "@/components/info-tooltip"

interface ZoneComparisonEnhancedProps {
  zone: ZoneMetrics
  city: CityMetrics
  allZones?: ZoneMetrics[]
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

  const zoneLimitedData = zone.total_listings < 10

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
      zoneValue: zoneLimitedData ? "Muestra insuficiente" : formatPrice(zone.avg_ticket),
      cityValue: formatPrice(city.avg_ticket),
      zoneRaw: zoneLimitedData ? 0 : zone.avg_ticket,
      cityRaw: city.avg_ticket,
    },
    // Superficie Promedio: only show when both sides have valid ticket and price/m²
    ...(zone.avg_ticket > 0 && zone.avg_price_per_m2 > 0 && city.avg_ticket > 0 && city.avg_price_per_m2 > 0
      ? [{
          label: "Superficie Promedio",
          zoneValue: zoneLimitedData
            ? "—"
            : `${Math.round(zone.avg_ticket / zone.avg_price_per_m2)} m²`,
          cityValue: `${Math.round(city.avg_ticket / city.avg_price_per_m2)} m²`,
          zoneRaw: zoneLimitedData ? 0 : Math.round(zone.avg_ticket / zone.avg_price_per_m2),
          cityRaw: Math.round(city.avg_ticket / city.avg_price_per_m2),
        }]
      : []),
    {
      label: "Inventario",
      zoneValue: getZoneActivityLabel(zone.total_listings),
      cityValue: getCityActivityLabel(city.total_listings),
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
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow">
      <div className="flex items-center gap-1.5 mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Zona vs Ciudad
        </h4>
        <InfoTooltip content="Compara las métricas de esta zona contra el promedio de toda Tijuana. Las barras más largas indican valores más altos. Útil para identificar si la zona está por arriba o debajo del mercado." />
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const max = Math.max(row.zoneRaw, row.cityRaw, 1)
          const zonePct = Math.round((row.zoneRaw / max) * 100)
          const cityPct = Math.round((row.cityRaw / max) * 100)
          const diffPct = row.cityRaw > 0 ? Math.abs((row.zoneRaw - row.cityRaw) / row.cityRaw) * 100 : 0
          const isNearlyEqual = diffPct < 2

          return (
            <div key={row.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {row.label}
                </p>
                {isNearlyEqual && (
                  <span className="text-[9px] font-semibold text-blue-500 dark:text-blue-400">≈ Promedio de la ciudad</span>
                )}
              </div>

              {/* Zone bar */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-700 dark:text-blue-400 w-7">
                  Zona
                </span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      zoneLimitedData && (row.label === "Ticket Promedio" || row.label === "Superficie Promedio")
                        ? "bg-slate-300 dark:bg-slate-700"
                        : "bg-slate-700"
                    }`}
                    style={{ width: `${zonePct}%` }}
                  />
                </div>
                <span className={`text-xs font-bold min-w-[80px] text-right ${
                  zoneLimitedData && (row.label === "Ticket Promedio" || row.label === "Superficie Promedio")
                    ? "text-slate-400 dark:text-slate-500 italic"
                    : "text-slate-700 dark:text-slate-300"
                }`}>
                  {row.zoneValue}
                </span>
              </div>

              {/* City bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 w-7">
                  Tijuana
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
