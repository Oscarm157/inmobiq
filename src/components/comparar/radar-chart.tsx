"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { ZoneMetrics, PropertyType } from "@/types/database"

interface ZoneRadarChartProps {
  zones: ZoneMetrics[]
  colors: string[]
}

/** Shannon entropy normalized to 0-1 for a distribution */
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

export function ZoneRadarChart({ zones, colors }: ZoneRadarChartProps) {
  if (zones.length === 0) return null

  // Compute raw values for normalization
  const maxPrice = Math.max(...zones.map((z) => z.avg_price_per_m2))
  const maxInventory = Math.max(...zones.map((z) => z.total_listings))
  const maxTicket = Math.max(...zones.map((z) => z.avg_ticket))

  const normalize = (val: number, max: number) => (max > 0 ? Math.round((val / max) * 100) : 0)
  const normalizeTrend = (pct: number) => Math.round(Math.min(100, Math.max(0, (pct + 10) * (100 / 20))))

  const dimensions = ["Precio/m²", "Inventario", "Tendencia", "Diversidad", "Ticket"]

  const data = dimensions.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim }
    zones.forEach((zone) => {
      switch (dim) {
        case "Precio/m²":
          point[zone.zone_slug] = normalize(zone.avg_price_per_m2, maxPrice)
          break
        case "Inventario":
          point[zone.zone_slug] = normalize(zone.total_listings, maxInventory)
          break
        case "Tendencia":
          point[zone.zone_slug] = normalizeTrend(zone.price_trend_pct)
          break
        case "Diversidad":
          point[zone.zone_slug] = Math.round(shannonDiversity(zone.listings_by_type) * 100)
          break
        case "Ticket":
          point[zone.zone_slug] = normalize(zone.avg_ticket, maxTicket)
          break
      }
    })
    return point
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
        Perfil de zona
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        5 dimensiones normalizadas (0-100) para comparar perfiles
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(100,116,139,0.2)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-slate-600 dark:text-slate-400"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "currentColor" }}
            className="text-slate-400"
          />
          {zones.map((zone, i) => (
            <Radar
              key={zone.zone_slug}
              name={zone.zone_name}
              dataKey={zone.zone_slug}
              stroke={colors[i]}
              fill={colors[i]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: "12px" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
