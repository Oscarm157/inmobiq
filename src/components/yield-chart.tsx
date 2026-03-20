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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

interface YieldChartProps {
  riskData: ZoneRiskMetrics[]
  zones: ZoneMetrics[]
}

export function YieldChart({ riskData, zones }: YieldChartProps) {
  const data = riskData.map((r) => {
    const zone = zones.find((z) => z.zone_slug === r.zone_slug)
    return {
      zone: r.zone_name,
      price_per_m2: zone?.avg_price_per_m2 ?? 0,
      cap_rate: r.cap_rate,
      risk_label: r.risk_label,
      liquidity: r.liquidity_score,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento vs Precio de Entrada</CardTitle>
        <CardDescription>
          Cap rate estimado vs precio por m² — identifica zonas con mejor relación costo-rendimiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="price_per_m2"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            >
              <Label value="Precio x m² →" offset={-10} position="insideBottomRight" className="text-xs" />
            </XAxis>
            <YAxis type="number" dataKey="cap_rate">
              <Label value="Cap Rate % →" angle={-90} position="insideLeft" className="text-xs" />
            </YAxis>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "price_per_m2") return `$${Number(value).toLocaleString("es-MX")}/m²`
                    if (name === "cap_rate") return `${value}% anual`
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
                  r={Math.max(6, entry.liquidity / 12)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-3">
          {Object.entries(riskColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-bold text-slate-500">Riesgo {label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
