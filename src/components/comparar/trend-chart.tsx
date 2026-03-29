"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics } from "@/types/database"
import type { ZoneTrendPoint } from "@/lib/data/comparator"

interface TrendChartProps {
  trendSeries: ZoneTrendPoint[]
  slugs: string[]
  zones: ZoneMetrics[]
  colors: string[]
}

export function TrendChart({ trendSeries, slugs, zones, colors }: TrendChartProps) {
  const { formatPrice } = useCurrency()

  if (!trendSeries.length) return null

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={trendSeries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [formatPrice(value), "$/m²"]}
          contentStyle={{
            backgroundColor: "var(--color-bg, white)",
            border: "1px solid rgba(100,116,139,0.2)",
            borderRadius: "12px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {slugs.map((slug, i) => {
          const zone = zones.find((z) => z.zone_slug === slug)
          return (
            <Line
              key={slug}
              type="monotone"
              dataKey={slug}
              name={zone?.zone_name ?? slug}
              stroke={colors[i]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
