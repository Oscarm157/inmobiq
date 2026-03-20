"use client"

import { useState } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

const TYPE_COLORS: Record<string, string> = {
  departamento: "#7c3aed",
  casa: "#2563eb",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  departamento: "Depto",
  casa: "Casa",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

const chartConfig = {
  price: { label: "Precio", color: "#2563eb" },
} satisfies ChartConfig

interface ScatterPoint {
  area: number
  price: number
  type: string
  title: string
}

interface PriceAreaScatterProps {
  data: ScatterPoint[]
  availableTypes: string[]
}

export function PriceAreaScatter({ data, availableTypes }: PriceAreaScatterProps) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(availableTypes))

  if (!data.length) return null

  const filteredData = data.filter((d) => activeTypes.has(d.type))

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const formatPrice = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Superficie vs Precio
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Relación tamaño-precio por propiedad — detecta valor y sobreprecios
        </p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableTypes.map((type) => {
          const active = activeTypes.has(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                transition-all duration-200 border
                ${active
                  ? "border-transparent text-white shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 bg-transparent hover:border-slate-300"
                }
              `}
              style={active ? { backgroundColor: TYPE_COLORS[type] ?? "#6b7280" } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] ?? "#6b7280", opacity: active ? 1 : 0.3 }}
              />
              {TYPE_LABELS[type] ?? type}
            </button>
          )
        })}
      </div>

      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="area"
            type="number"
            name="m²"
            tickLine={false}
            axisLine={false}
            className="text-[10px]"
            tickFormatter={(v: number) => `${v}m²`}
          />
          <YAxis
            dataKey="price"
            type="number"
            name="Precio"
            tickLine={false}
            axisLine={false}
            className="text-[10px]"
            tickFormatter={formatPrice}
            width={60}
          />
          <Scatter data={filteredData}>
            {filteredData.map((entry, i) => (
              <Cell
                key={i}
                fill={TYPE_COLORS[entry.type] ?? "#6b7280"}
                fillOpacity={0.45}
                stroke={TYPE_COLORS[entry.type] ?? "#6b7280"}
                strokeOpacity={0.7}
                strokeWidth={1}
                r={14}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>

      <p className="text-[10px] text-slate-400 mt-2">
        Cada punto = 1 propiedad · Abajo-derecha = más m² por menos precio (mejor valor)
      </p>
    </div>
  )
}
