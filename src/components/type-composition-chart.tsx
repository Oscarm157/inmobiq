"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface TypeCompositionChartProps {
  data: { type: string; count: number; pct: number }[]
  totalListings: number
}

const TYPE_COLORS: Record<string, string> = {
  casa: "#2563eb",
  departamento: "#7c3aed",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Depto",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  type: string
  pct: number
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  type,
  pct,
}: CustomLabelProps) {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 20
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  const label = TYPE_LABELS[type] ?? type
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
    >
      {label} {pct}%
    </text>
  )
}

export function TypeCompositionChart({
  data,
  totalListings,
}: TypeCompositionChartProps) {
  const dominant = useMemo(() => {
    if (data.length === 0) return null
    return [...data].sort((a, b) => b.count - a.count)[0]
  }, [data])

  const dominantLabel = dominant
    ? TYPE_LABELS[dominant.type] ?? dominant.type
    : ""

  const description = dominant
    ? `${dominantLabel} domina con ${dominant.pct}% del mercado`
    : "Composición por tipo de propiedad"

  return (
    <div className="bg-white rounded-xl p-5 card-shadow">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Composición del mercado
        </h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            label={renderCustomLabel}
            labelLine={false}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.type}
                fill={TYPE_COLORS[entry.type] ?? "#94a3b8"}
              />
            ))}
          </Pie>
          {/* Center label */}
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 20, fontWeight: 700, fill: "#1e293b" }}
          >
            100%
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 10, fill: "#94a3b8" }}
          >
            del mercado
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
