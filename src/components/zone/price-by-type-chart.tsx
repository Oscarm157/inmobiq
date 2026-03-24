"use client"

import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrency } from "@/contexts/currency-context"
import { InfoTooltip } from "@/components/info-tooltip"

const COLORS: Record<string, string> = {
  departamento: "#7c3aed",
  casa: "#2563eb",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const chartConfig = {
  avgTicket: { label: "Ticket", color: "#2563eb" },
} satisfies ChartConfig

interface PriceByTypeData {
  type: string
  typeKey: string
  avgTicket: number
  label: string
}

interface PriceByTypeChartProps {
  data: PriceByTypeData[]
  zoneName: string
}

export function PriceByTypeChart({ data, zoneName }: PriceByTypeChartProps) {
  const { formatPrice } = useCurrency()
  if (!data.length) return null

  // Re-format labels client-side to respect currency preference
  const chartData = data.map((d) => ({ ...d, label: formatPrice(d.avgTicket) }))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Ticket Promedio por Tipo
          </h3>
          <InfoTooltip content="Precio promedio de venta por tipo de propiedad en esta zona. Se calculan solo con listings activos que pasaron validación de precio (se excluyen precios atípicos)." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Precio promedio de propiedad en {zoneName}
        </p>
      </div>
      <ChartContainer config={chartConfig} className="h-[170px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 90, left: 0, bottom: 0 }}
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
          <Bar dataKey="avgTicket" radius={[0, 6, 6, 0]} barSize={16}>
            {chartData.map((entry) => (
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
