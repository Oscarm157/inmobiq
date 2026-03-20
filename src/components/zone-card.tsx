import Link from "next/link"
import { Icon } from "@/components/icon"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"
import type { ZoneMetrics } from "@/types/database"

interface ZoneCardProps {
  zone: ZoneMetrics
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const isPositive = zone.price_trend_pct > 0

  return (
    <Link href={`/zona/${zone.zone_slug}`} className="group">
      <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300 border border-slate-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Icon name="location_on" className="text-blue-700 text-sm" />
            </div>
            <h3 className="font-bold text-sm">{zone.zone_name}</h3>
          </div>
          <Icon
            name="arrow_forward"
            className="text-slate-300 text-sm group-hover:text-blue-600 transition-colors"
          />
        </div>

        <div className="mb-3">
          <p className="text-xl font-black">
            {formatCurrency(zone.avg_price_per_m2)}
            <span className="text-xs font-medium text-slate-500"> /m²</span>
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold">
          {zone.price_trend_pct === 0 ? (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Nuevo</span>
          ) : (
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {formatPercent(zone.price_trend_pct)}
            </span>
          )}
          <span className="text-slate-400">
            {formatNumber(zone.total_listings)} props
          </span>
        </div>
      </div>
    </Link>
  )
}
