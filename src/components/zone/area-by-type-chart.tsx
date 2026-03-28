"use client"

import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { InfoTooltip } from "@/components/info-tooltip"
import { EmptyState } from "@/components/empty-state"

const COLORS: Record<string, string> = {
  departamento: "#7c3aed",
  casa: "#2563eb",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const chartConfig = {
  area: { label: "Superficie", color: "#2563eb" },
} satisfies ChartConfig

export interface AreaByTypeData {
  type: string
  typeKey: string
  area: number
  label: string
}

interface Props {
  data: AreaByTypeData[]
  zoneName: string
}

export function AreaByTypeChart({ data, zoneName }: Props) {
  if (!data.length) return <EmptyState description="No hay datos de superficie por tipo de propiedad." />

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Superficie Promedio por Tipo
          </h3>
          <InfoTooltip content="Mediana de metros cuadrados por tipo de propiedad en esta zona. Se calculan solo con listings activos que reportan superficie." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Mediana de m² por tipologia en {zoneName}
        </p>
      </div>
      <ChartContainer config={chartConfig} className="h-[170px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 70, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="type"
            type="category"
            tickLine={false}
            axisLine={false}
            width={100}
            className="text-xs font-semibold"
          />
          <Bar dataKey="area" radius={[0, 6, 6, 0]} barSize={16}>
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
