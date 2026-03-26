"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ResponsiveContainer } from "recharts"
import type { ValuationResult } from "@/types/database"

interface Props {
  distribution: ValuationResult["zone_price_distribution"]
}

export function PricePositionChart({ distribution }: Props) {
  const total = distribution.reduce((s, d) => s + d.count, 0)

  const data = distribution.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
        Distribucion de precios/m² en la zona
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        La barra resaltada indica el rango donde se ubica tu propiedad
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.has_property ? "#2563eb" : "#cbd5e1"}
                stroke={entry.has_property ? "#1d4ed8" : "transparent"}
                strokeWidth={entry.has_property ? 2 : 0}
              />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
