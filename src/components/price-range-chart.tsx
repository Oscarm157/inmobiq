"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts"

interface PriceRangeChartProps {
  data: { range: string; count: number; pct: number }[]
}

const BLUE_GRADIENT = [
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
]

export function PriceRangeChart({ data }: PriceRangeChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        fill: BLUE_GRADIENT[i % BLUE_GRADIENT.length],
        label: `${d.pct}%`,
      })),
    [data]
  )

  const dominant = useMemo(() => {
    if (data.length === 0) return null
    return [...data].sort((a, b) => b.count - a.count)[0]
  }, [data])

  const description = dominant
    ? `El rango más común es ${dominant.range} con ${dominant.pct}% de las propiedades`
    : "Distribución de propiedades por rango de precio"

  return (
    <div className="bg-surface rounded-xl p-5 card-shadow">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Distribución de precios
        </h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 24, right: 8, left: 8, bottom: 0 }}
        >
          <XAxis
            dataKey="range"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#64748b" }}
            interval={0}
          />
          <YAxis hide />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
            {chartData.map((entry) => (
              <Cell key={entry.range} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              style={{ fontSize: 10, fill: "#334155", fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
