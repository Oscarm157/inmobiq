"use client"

import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrency } from "@/contexts/currency-context"
import { DrillDownPanel, type DrillDownListing } from "@/components/zone/drill-down-panel"

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
  /** Dev-only: listings grouped by price range for drill-down */
  listingsByRange?: Record<string, DrillDownListing[]>
  zoneSlug?: string
}

export function PriceDistributionChart({ data, listingsByRange, zoneSlug }: PriceDistributionChartProps) {
  const { currency } = useCurrency()
  const [selectedRange, setSelectedRange] = useState<string | null>(null)
  const devMode = !!listingsByRange

  if (!data.length) return null

  const handleBarClick = (entry: PriceDistributionData) => {
    if (!devMode) return
    setSelectedRange((prev) => prev === entry.range ? null : entry.range)
  }

  const selectedListings = selectedRange ? (listingsByRange?.[selectedRange] ?? []) : []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Distribución de Precios
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Concentración de propiedades por rango de precio ({currency})
          {devMode && <span className="text-amber-500 ml-2">· clic en barra para inspeccionar</span>}
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
            cursor={devMode ? "pointer" : undefined}
            onClick={(_data: unknown, index: number) => handleBarClick(data[index])}
          >
            <LabelList
              dataKey="label"
              position="top"
              className="text-[11px] font-bold fill-slate-600 dark:fill-slate-300"
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Dev drill-down panel */}
      {devMode && selectedRange && selectedListings.length > 0 && (
        <DrillDownPanel
          listings={selectedListings}
          label={`Rango ${selectedRange}`}
          zoneSlug={zoneSlug ?? ""}
          chartType="price_distribution"
          onClose={() => setSelectedRange(null)}
        />
      )}
    </div>
  )
}
