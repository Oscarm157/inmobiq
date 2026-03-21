"use client"

import Link from "next/link"
import { Icon } from "@/components/icon"
import { formatPercent, formatNumber } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"
import { getPriceColor } from "@/lib/geo-data"
import type { ZoneMetrics } from "@/types/database"

interface ZoneCardProps {
  zone: ZoneMetrics
  rank?: number
  maxListings?: number
}

const TYPE_LABELS: Record<string, { short: string; icon: string }> = {
  casa: { short: "Casa", icon: "home" },
  departamento: { short: "Depto", icon: "apartment" },
  terreno: { short: "Terreno", icon: "landscape" },
  local: { short: "Local", icon: "storefront" },
  oficina: { short: "Oficina", icon: "business" },
}

export function ZoneCard({ zone, rank, maxListings }: ZoneCardProps) {
  const { formatPrice } = useCurrency()
  const isPositive = zone.price_trend_pct > 0
  const priceColor = getPriceColor(zone.avg_price_per_m2)

  // Top 3 property types by count
  const topTypes = Object.entries(zone.listings_by_type)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Relative inventory bar width
  const inventoryPct = maxListings && maxListings > 0
    ? Math.max(8, (zone.total_listings / maxListings) * 100)
    : 0

  return (
    <Link href={`/zona/${zone.zone_slug}`} className="group">
      <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300 border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {rank ? (
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ backgroundColor: priceColor }}
              >
                {rank}
              </span>
            ) : (
              <div className="flex-shrink-0 w-1.5 h-6 rounded-full" style={{ backgroundColor: priceColor }} />
            )}
            <h3 className="font-bold text-sm truncate">{zone.zone_name}</h3>
          </div>
          <Icon
            name="arrow_forward"
            className="text-slate-300 text-sm group-hover:text-slate-700 transition-colors flex-shrink-0"
          />
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-xl font-black">
            {formatPrice(zone.avg_price_per_m2)}
            <span className="text-xs font-medium text-slate-500"> /m²</span>
          </p>
        </div>

        {/* Property type pills */}
        {topTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {topTypes.map(([type, count]) => {
              const info = TYPE_LABELS[type]
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-medium"
                >
                  <Icon name={info?.icon ?? "home"} className="text-[10px]" />
                  {count}
                </span>
              )
            })}
          </div>
        )}

        {/* Inventory bar + trend */}
        <div className="flex items-center justify-between text-[10px] font-bold">
          {zone.price_trend_pct === 0 ? (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Sin tendencia</span>
          ) : (
            <span className={`flex items-center gap-0.5 ${isPositive ? "text-green-600" : "text-red-600"}`}>
              <Icon name={isPositive ? "trending_up" : "trending_down"} className="text-xs" />
              {formatPercent(zone.price_trend_pct)}
            </span>
          )}
          <div className="flex items-center gap-2">
            {maxListings ? (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${inventoryPct}%`, backgroundColor: priceColor }}
                  />
                </div>
                <span className="text-slate-400">{formatNumber(zone.total_listings)}</span>
              </div>
            ) : (
              <span className="text-slate-400">{formatNumber(zone.total_listings)} props</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
