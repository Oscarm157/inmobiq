"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { InfoTooltip } from "@/components/info-tooltip"

const chartConfig = {
  casa_median: { label: "Casa", color: "#2563eb" },
  depto_median: { label: "Departamento", color: "#7c3aed" },
} satisfies ChartConfig

interface PriceByBedroomsData {
  bedrooms: number
  casa_median: number | null
  depto_median: number | null
  casa_count: number
  depto_count: number
}

interface PriceByBedroomsChartProps {
  data: PriceByBedroomsData[]
  zoneName: string
}

function shortPrice(v: number | null): string {
  if (v == null || v === 0) return ""
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

function buildExample(data: PriceByBedroomsData[]): string {
  // Find two consecutive bedroom counts with casa data to show price jump
  const withCasa = data.filter((d) => d.casa_median != null && d.casa_median > 0)
  if (withCasa.length >= 2) {
    const a = withCasa[0]
    const b = withCasa[1]
    const diff = (b.casa_median! - a.casa_median!) / a.casa_median! * 100
    if (diff > 0) {
      return ` Ej: una casa de ${b.bedrooms} rec. cuesta ${Math.round(diff)}% más que una de ${a.bedrooms} rec.`
    }
  }
  return ""
}

export function PriceByBedroomsChart({ data, zoneName }: PriceByBedroomsChartProps) {
  if (!data.length) return null

  const hasDepto = data.some((d) => d.depto_median != null && d.depto_median > 0)

  // Transform data: replace null with 0 for Recharts but track originals for hiding
  const chartData = data.map((d) => ({
    bedrooms: `${d.bedrooms} rec`,
    casa_median: d.casa_median ?? 0,
    depto_median: d.depto_median ?? 0,
    _casa_null: d.casa_median == null || d.casa_median === 0,
    _depto_null: d.depto_median == null || d.depto_median === 0,
    casa_label: shortPrice(d.casa_median),
    depto_label: shortPrice(d.depto_median),
  }))

  const example = buildExample(data)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Precio por recámaras
          </h3>
          <InfoTooltip content="Precio mediano por número de recámaras, separado por casa y departamento. La mediana es más representativa que el promedio porque no se distorsiona con propiedades de lujo." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          ¿Cuánto más cuesta una recámara extra en {zoneName}?{example}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#2563eb" }} />
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Casa</span>
        </div>
        {hasDepto && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7c3aed" }} />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Departamento</span>
          </div>
        )}
      </div>

      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
          <XAxis
            dataKey="bedrooms"
            tickLine={false}
            axisLine={false}
            className="text-xs font-semibold"
          />
          <YAxis hide />
          <Bar dataKey="casa_median" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={hasDepto ? 28 : 40}>
            <LabelList
              dataKey="casa_label"
              position="top"
              className="text-[10px] font-bold fill-slate-600 dark:fill-slate-300"
            />
          </Bar>
          {hasDepto && (
            <Bar dataKey="depto_median" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={28}>
              <LabelList
                dataKey="depto_label"
                position="top"
                className="text-[10px] font-bold fill-slate-600 dark:fill-slate-300"
              />
            </Bar>
          )}
        </BarChart>
      </ChartContainer>
    </div>
  )
}
