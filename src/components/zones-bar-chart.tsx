"use client"

import { useState, useMemo } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  ResponsiveContainer,
} from "recharts"
import { useCurrency } from "@/contexts/currency-context"

interface ZonesBarChartProps {
  data: {
    zone_name: string
    zone_slug: string
    median_price_m2: number
    count: number
  }[]
}

function formatCompact(value: number, prefix: string): string {
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}k`
  return `${prefix}${value}`
}

export function ZonesBarChart({ data }: ZonesBarChartProps) {
  const { formatPrice, convert, currency } = useCurrency()
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.median_price_m2 - a.median_price_m2),
    [data]
  )

  const displayed = showAll ? sorted : sorted.slice(0, 8)
  const totalZones = sorted.length

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const description =
    first && last
      ? `¿Dónde es más caro el metro cuadrado? Ej: ${first.zone_name} ${formatPrice(first.median_price_m2)}/m² vs ${last.zone_name} ${formatPrice(last.median_price_m2)}/m²`
      : "¿Dónde es más caro el metro cuadrado?"

  const chartHeight = displayed.length * 38 + 16

  return (
    <div className="bg-white rounded-xl p-5 card-shadow">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Precio por m² en cada zona
        </h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={displayed}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="zone_name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={130}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Bar
            dataKey="median_price_m2"
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="median_price_m2"
              position="right"
              formatter={(v: number) => formatCompact(convert(v), currency === "USD" ? "US$" : "$")}
              style={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {totalZones > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          {showAll ? "Ver top 8" : `Ver las ${totalZones} zonas`}
        </button>
      )}
    </div>
  )
}
