"use client"

import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { InfoTooltip } from "@/components/info-tooltip"

const chartConfig = {
  casa_count: { label: "Casa", color: "#2563eb" },
  depto_count: { label: "Departamento", color: "#7c3aed" },
} satisfies ChartConfig

interface BedroomDistributionData {
  bedrooms: number
  casa_median: number | null
  depto_median: number | null
  casa_count: number
  depto_count: number
}

interface BedroomDistributionChartProps {
  data: BedroomDistributionData[]
  zoneName: string
}

export function BedroomDistributionChart({ data, zoneName }: BedroomDistributionChartProps) {
  if (!data.length) return null

  const hasDepto = data.some((d) => d.depto_count > 0)

  const chartData = data.map((d) => ({
    bedrooms: `${d.bedrooms} rec`,
    casa_count: d.casa_count,
    depto_count: d.depto_count,
    casa_label: d.casa_count > 0 ? `${d.casa_count}` : "",
    depto_label: d.depto_count > 0 ? `${d.depto_count}` : "",
  }))

  // Find dominant bedroom count
  const totalByBed = data.map((d) => ({ bed: d.bedrooms, total: d.casa_count + d.depto_count }))
  const dominant = totalByBed.reduce((a, b) => (b.total > a.total ? b : a), totalByBed[0])
  const totalAll = totalByBed.reduce((sum, b) => sum + b.total, 0)
  const dominantPct = totalAll > 0 ? Math.round((dominant.total / totalAll) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Distribución por Recámaras
          </h3>
          <InfoTooltip content="Cantidad de propiedades activas por número de recámaras. Muestra la composición del inventario para identificar la oferta dominante en la zona." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Inventario por número de recámaras en {zoneName}
          {dominantPct > 0 && ` · ${dominant.bed} rec domina con ${dominantPct}%`}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-2">
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

      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="bedrooms"
            type="category"
            tickLine={false}
            axisLine={false}
            width={60}
            className="text-xs font-semibold"
          />
          <Bar dataKey="casa_count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={hasDepto ? 12 : 16}>
            <LabelList
              dataKey="casa_label"
              position="right"
              className="text-[10px] font-bold fill-slate-600 dark:fill-slate-300"
            />
          </Bar>
          {hasDepto && (
            <Bar dataKey="depto_count" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={12}>
              <LabelList
                dataKey="depto_label"
                position="right"
                className="text-[10px] font-bold fill-slate-600 dark:fill-slate-300"
              />
            </Bar>
          )}
        </BarChart>
      </ChartContainer>
    </div>
  )
}
