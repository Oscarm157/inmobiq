"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Label,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ZoneRiskMetrics, ZoneMetrics } from "@/types/database"

const chartConfig = {
  zone: {
    label: "Zona",
    color: "#2563eb",
  },
} satisfies ChartConfig

const riskColors: Record<string, string> = {
  Bajo: "#22c55e",
  Medio: "#f59e0b",
  Alto: "#ef4444",
}

interface RiskMatrixProps {
  riskData: ZoneRiskMetrics[]
  zones: ZoneMetrics[]
}

interface RiskMatrixPoint {
  zone: string
  risk_score: number
  return_pct: number
  risk_label: ZoneRiskMetrics["risk_label"]
}

export function RiskMatrix({ riskData, zones }: RiskMatrixProps) {
  const data = riskData
    .map((r) => {
      const zone = zones.find((z) => z.zone_slug === r.zone_slug)
      const returnPct = Number.isFinite(zone?.price_trend_pct)
        ? Number(zone?.price_trend_pct)
        : r.smoothed_trend_pct

      if (!Number.isFinite(r.risk_score) || !Number.isFinite(returnPct)) {
        return null
      }

      return {
        zone: r.zone_name,
        risk_score: r.risk_score,
        return_pct: returnPct,
        risk_label: r.risk_label,
      } satisfies RiskMatrixPoint
    })
    .filter((entry): entry is RiskMatrixPoint => entry !== null)

  return (
    <div className="bg-surface rounded-xl p-6 card-shadow">
      <h3 className="text-xl font-bold mb-1">Matriz Riesgo vs Retorno</h3>
      <p className="text-xs text-slate-500 font-medium mb-6">
        Posicionamiento de cada zona según su perfil de riesgo y crecimiento
      </p>
      {data.length === 0 ? (
        <div className="h-[350px] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No hay datos suficientes para la matriz</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cuando existan métricas válidas de riesgo y retorno por zona, aparecerán aquí.</p>
          </div>
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="risk_score" domain={[15, 75]}>
            <Label value="Risk Score →" offset={-10} position="insideBottomRight" className="text-xs" />
          </XAxis>
          <YAxis type="number" dataKey="return_pct" domain={[-3, 9]}>
            <Label value="Retorno % →" angle={-90} position="insideLeft" className="text-xs" />
          </YAxis>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === "risk_score") return `Riesgo: ${value}`
                  if (name === "return_pct") return `Retorno: ${value}%`
                  return `${value}`
                }}
                nameKey="zone"
              />
            }
          />
          <Scatter data={data} fill="#2563eb">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={riskColors[entry.risk_label]}
                r={8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
      )}
      <div className="flex items-center justify-center gap-6 mt-4">
        {Object.entries(riskColors).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold text-slate-600">Riesgo {label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
