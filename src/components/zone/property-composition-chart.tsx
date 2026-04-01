"use client"

import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { InfoTooltip } from "@/components/info-tooltip"

const COLORS: Record<string, string> = {
  departamento: "#7c3aed",
  casa: "#2563eb",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const chartConfig = {
  score: { label: "Índice", color: "#2563eb" },
} satisfies ChartConfig

interface CompositionData {
  type: string
  typeKey: string
  score: number
  label: string
}

interface PropertyCompositionChartProps {
  data: CompositionData[]
}

export function PropertyCompositionChart({ data }: PropertyCompositionChartProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Índice de Concentración
          </h3>
          <InfoTooltip content="Mide qué tan dominante es cada tipo de propiedad en la zona vs el promedio de la ciudad. Escala 0–10: valores altos indican que ese tipo está sobre-representado aquí comparado con otras zonas." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Densidad relativa por tipo de propiedad (escala 0–10)
        </p>
      </div>
      <ChartContainer config={chartConfig} className="h-[160px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide domain={[0, 10]} />
          <YAxis
            dataKey="type"
            type="category"
            tickLine={false}
            axisLine={false}
            width={100}
            className="text-xs font-semibold"
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((entry) => (
              <Cell key={entry.typeKey} fill={COLORS[entry.typeKey] ?? "#6b7280"} />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              className="text-[11px] font-bold fill-slate-600 dark:fill-slate-300"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
