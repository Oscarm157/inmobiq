"use client"

import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"

const SHORT_ACTIVITY: Record<string, string> = {
  "Alta actividad": "Alto",
  "Actividad moderada": "Medio",
  "Actividad baja": "Bajo",
  "Datos limitados": "Limitado",
}
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

  // Calculate total across all zones for type distribution
  const totalAllZones = zones.reduce((sum, z) => {
    const typeTotal = z.listings_by_type
      ? Object.values(z.listings_by_type).reduce((s, c) => s + c, 0)
      : 0
    return sum + typeTotal
  }, 0)

  return (
    <div className={`grid gap-4 ${zones.length === 2 ? "grid-cols-1 sm:grid-cols-2" : zones.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
      {zones.map((zone, i) => {
        const zoneColor = colors[i]
        const typeTotal = zone.listings_by_type
          ? Object.values(zone.listings_by_type).reduce((s, c) => s + c, 0)
          : 0

        return (
          <div
            key={zone.zone_slug}
            className="rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
            style={{ backgroundColor: `${zoneColor}18` }}
          >
            {/* Colored header */}
            <div
              className="px-6 pt-5 pb-4"
              style={{ background: `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}18)` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {zone.zone_name}
                </h3>
                <div
                  className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800"
                  style={{ backgroundColor: zoneColor }}
                />
              </div>
              {/* Precio/m² — hero metric */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: zoneColor }}>
                  Precio / m²
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {formatPrice(zone.avg_price_per_m2)}
                  </span>
                  {zone.price_trend_pct !== 0 && (
                    <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      zone.price_trend_pct >= 0
                        ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/40"
                        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/40"
                    }`}>
                      <Icon
                        name={zone.price_trend_pct >= 0 ? "arrow_drop_up" : "arrow_drop_down"}
                        className="text-sm"
                      />
                      {formatPercent(Math.abs(zone.price_trend_pct))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-5 pt-4 space-y-5 bg-white/70 dark:bg-slate-900/70">
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
                    {SHORT_ACTIVITY[getZoneActivityLabel(zone.total_listings)] ?? getZoneActivityLabel(zone.total_listings)}
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
                    Distribución
                  </p>
                  <div
                    className="flex h-2.5 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: `${zoneColor}30` }}
                  >
                    {Object.entries(zone.listings_by_type)
                      .filter(([, count]) => count > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="h-full"
                          style={{
                            backgroundColor: TYPE_COLORS[type] ?? "#94a3b8",
                            width: `${(count / typeTotal) * 100}%`,
                          }}
                        />
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {Object.entries(zone.listings_by_type)
                      .filter(([, count]) => count > 0)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([type, count]) => (
                        <span key={type} className="text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 font-bold">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[type] ?? "#94a3b8" }}
                          />
                          <span className="capitalize">{type === "departamento" ? "Depto" : type}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">{Math.round((count / typeTotal) * 100)}%</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
