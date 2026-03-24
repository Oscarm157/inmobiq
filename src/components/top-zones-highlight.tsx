"use client"

import { Icon } from "@/components/icon"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics } from "@/types/database"
import Link from "next/link"

interface TopZonesHighlightProps {
  topByPrice: ZoneMetrics[]
  topByAffordable: ZoneMetrics[]
}

export function TopZonesHighlight({ topByPrice, topByAffordable }: TopZonesHighlightProps) {
  const { formatPrice } = useCurrency()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Más caras */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <Icon name="payments" className="text-lg" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Zonas Más Caras</h4>
            <p className="text-[10px] text-slate-400 font-medium">Por precio promedio x m²</p>
          </div>
        </div>
        <div className="space-y-3">
          {topByPrice.slice(0, 3).map((zone, i) => (
            <Link
              key={zone.zone_id}
              href={`/zona/${zone.zone_slug}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{zone.zone_name}</p>
                <p className="text-xs text-slate-400">{getZoneActivityLabel(zone.total_listings)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatPrice(zone.avg_price_per_m2)}/m²</p>
                <p className={`text-[10px] font-bold ${zone.price_trend_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {zone.price_trend_pct >= 0 ? "+" : ""}{zone.price_trend_pct.toFixed(1)}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Más económicas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 flex items-center justify-center">
            <Icon name="savings" className="text-lg" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Más Económicas</h4>
            <p className="text-[10px] text-slate-400 font-medium">Menor precio promedio x m²</p>
          </div>
        </div>
        <div className="space-y-3">
          {topByAffordable.slice(0, 3).map((zone, i) => (
            <Link
              key={zone.zone_id}
              href={`/zona/${zone.zone_slug}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                i === 0 ? "bg-green-100 text-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{zone.zone_name}</p>
                <p className="text-xs text-slate-400">{getZoneActivityLabel(zone.total_listings)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatPrice(zone.avg_price_per_m2)}/m²</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
