"use client"

import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/empty-state"

const chartConfig = {
  yield: { label: "Yield %", color: "#10b981" },
} satisfies ChartConfig

export interface YieldByTypeData {
  type: string
  typeLabel: string
  yieldPct: number
  avgRent: number
  avgSalePrice: number
}

interface YieldByTypeChartProps {
  data: YieldByTypeData[]
}

export function YieldByTypeChart({ data }: YieldByTypeChartProps) {
  if (!data.length) return <EmptyState icon="savings" description="No hay datos de renta y venta suficientes para calcular yield por tipo." />

  const chartData = data.map((d) => ({
    type: d.typeLabel,
    yield: Number(d.yieldPct.toFixed(1)),
    label: `${d.yieldPct.toFixed(1)}%`,
  }))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Yield Bruto por Tipo
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Rendimiento anual estimado comparando renta mensual vs precio de venta
        </p>
      </div>

      <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
          <Bar dataKey="yield" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24}>
            <LabelList dataKey="label" position="right" className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-bold" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
