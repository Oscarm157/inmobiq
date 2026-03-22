"use client"

import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics, CityMetrics } from "@/types/database"

interface KPITickerStripProps {
  zone: ZoneMetrics
  city: CityMetrics
  absorptionPct: number
}

interface KPICell {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string
  sub?: string
  subColor?: string
}

export function KPITickerStrip({ zone, city, absorptionPct }: KPITickerStripProps) {
  const { formatPrice } = useCurrency()
  const diffFromCity = ((zone.avg_price_per_m2 - city.avg_price_per_m2) / city.avg_price_per_m2) * 100
  const trendPositive = zone.price_trend_pct >= 0

  const cells: KPICell[] = [
    {
      icon: "payments",
      iconBg: "bg-slate-50 dark:bg-blue-950",
      iconColor: "text-slate-800 dark:text-blue-400",
      label: "Precio / m²",
      value: formatPrice(zone.avg_price_per_m2),
      sub: zone.price_trend_pct === 0 ? "Sin histórico" : formatPercent(zone.price_trend_pct),
      subColor: zone.price_trend_pct === 0 ? "text-slate-400" : trendPositive ? "text-emerald-600" : "text-red-600",
    },
    {
      icon: "sell",
      iconBg: "bg-violet-50 dark:bg-violet-950",
      iconColor: "text-violet-700 dark:text-violet-400",
      label: "Ticket Promedio",
      value: formatPrice(zone.avg_ticket),
    },
    {
      icon: "inventory_2",
      iconBg: "bg-indigo-50 dark:bg-indigo-950",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      label: "Inventario Activo",
      value: getZoneActivityLabel(zone.total_listings),
      sub: "",
      subColor: "text-slate-500",
    },
    {
      icon: "trending_up",
      iconBg: trendPositive ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950",
      iconColor: trendPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      label: "Tendencia",
      value: zone.price_trend_pct === 0 ? "Sin histórico" : formatPercent(zone.price_trend_pct),
      sub: zone.price_trend_pct === 0 ? "" : "vs periodo anterior",
      subColor: "text-slate-400",
    },
    {
      icon: "compare_arrows",
      iconBg: diffFromCity > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-emerald-50 dark:bg-emerald-950",
      iconColor: diffFromCity > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      label: "vs Ciudad",
      value: `${diffFromCity > 0 ? "+" : ""}${diffFromCity.toFixed(1)}%`,
      sub: diffFromCity > 0 ? "más caro" : "más barato",
      subColor: "text-slate-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${cell.iconBg}`}>
              <Icon name={cell.icon} className={`text-base ${cell.iconColor}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {cell.label}
            </span>
          </div>
          <p className="text-xl font-black tracking-tight">{cell.value}</p>
          {cell.sub && (
            <p className={`text-[11px] font-semibold mt-0.5 ${cell.subColor}`}>{cell.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
