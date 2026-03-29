"use client"

import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics } from "@/types/database"

const TYPE_COLORS: Record<string, string> = {
  casa: "#2563eb",
  departamento: "#7c3aed",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

interface KpiCardsProps {
  zones: ZoneMetrics[]
  colors: string[]
}

export function KpiCards({ zones, colors }: KpiCardsProps) {
  const { formatPrice } = useCurrency()

  return (
    <div className={`grid gap-4 ${zones.length === 2 ? "grid-cols-1 sm:grid-cols-2" : zones.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
      {zones.map((zone, i) => (
        <div
          key={zone.zone_slug}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="h-1" style={{ backgroundColor: colors[i] }} />
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {zone.zone_name}
            </h3>

            {/* Precio/m² */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Precio / m²
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatPrice(zone.avg_price_per_m2)}
                </span>
                {zone.price_trend_pct !== 0 && (
                  <span className={`flex items-center text-xs font-bold ${zone.price_trend_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <Icon
                      name={zone.price_trend_pct >= 0 ? "arrow_drop_up" : "arrow_drop_down"}
                      className="text-sm"
                    />
                    {formatPercent(Math.abs(zone.price_trend_pct))}
                  </span>
                )}
              </div>
            </div>

            {/* Inventario + Ticket */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Inventario
                </p>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                  zone.total_listings > 50
                    ? "text-green-600 bg-green-50 dark:bg-green-950/30"
                    : zone.total_listings > 20
                      ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                      : "text-red-600 bg-red-50 dark:bg-red-950/30"
                }`}>
                  {getZoneActivityLabel(zone.total_listings)}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Ticket Prom.
                </p>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {formatPrice(zone.avg_ticket)}
                </span>
              </div>
            </div>

            {/* Distribución de tipología */}
            {zone.listings_by_type && Object.keys(zone.listings_by_type).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Distribución de Tipología
                </p>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {Object.entries(zone.listings_by_type)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="h-full"
                        style={{
                          backgroundColor: TYPE_COLORS[type] ?? "#94a3b8",
                          width: `${(count / zone.total_listings) * 100}%`,
                        }}
                      />
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(zone.listings_by_type)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([type]) => (
                      <span key={type} className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[type] ?? "#94a3b8" }}
                        />
                        <span className="capitalize">{type === "departamento" ? "Depto" : type}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
