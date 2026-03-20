"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  count: { label: "Propiedades", color: "#2563eb" },
} satisfies ChartConfig

interface PriceDistributionData {
  range: string
  count: number
  label: string
}

interface PriceDistributionChartProps {
  data: PriceDistributionData[]
}

export function PriceDistributionChart({ data }: PriceDistributionChartProps) {
  if (!data.length) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Distribución de Precios
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Concentración de propiedades por rango de precio (USD)
        </p>
      </div>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart
          data={data}
          margin={{ top: 20, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="range"
            tickLine={false}
            axisLine={false}
            className="text-[10px] font-semibold"
          />
          <YAxis hide />
          <Bar
            dataKey="count"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
            barSize={40}
          >
            <LabelList
              dataKey="label"
              position="top"
              className="text-[11px] font-bold fill-slate-600 dark:fill-slate-300"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
