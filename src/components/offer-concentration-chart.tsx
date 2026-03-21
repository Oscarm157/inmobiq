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

interface OfferConcentrationChartProps {
  data: {
    zone_name: string
    zone_slug: string
    count: number
    pct: number
  }[]
}

export function OfferConcentrationChart({
  data,
}: OfferConcentrationChartProps) {
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.pct - a.pct),
    [data]
  )

  const displayed = showAll ? sorted : sorted.slice(0, 8)
  const totalZones = sorted.length

  const top = sorted[0]

  const description = top
    ? `${top.zone_name} concentra el ${top.pct}% de la oferta con ${top.count} propiedades`
    : "Distribución de propiedades por zona"

  const chartData = useMemo(
    () =>
      displayed.map((d) => ({
        ...d,
        label: `${d.count} (${d.pct}%)`,
      })),
    [displayed]
  )

  const chartHeight = displayed.length * 38 + 16

  return (
    <div className="bg-white rounded-xl p-5 card-shadow">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Concentración de oferta
        </h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 4, bottom: 0 }}
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
            dataKey="pct"
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="label"
              position="right"
              style={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {totalZones > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-3 text-xs font-medium text-slate-700 hover:text-blue-800 transition-colors cursor-pointer"
        >
          {showAll ? "Ver top 8" : `Ver las ${totalZones} zonas`}
        </button>
      )}
    </div>
  )
}
