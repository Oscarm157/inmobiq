"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
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
import type { ZoneRiskMetrics } from "@/types/database"

const chartConfig = {
  volatility: {
    label: "Volatilidad %",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

const riskColors: Record<string, string> = {
  Bajo: "#22c55e",
  Medio: "#f59e0b",
  Alto: "#ef4444",
}

interface VolatilityChartProps {
  riskData: ZoneRiskMetrics[]
}

export function VolatilityChart({ riskData }: VolatilityChartProps) {
  const data = [...riskData]
    .sort((a, b) => b.volatility - a.volatility)
    .map((r) => ({
      zone: r.zone_name.replace("Residencial del Bosque", "Res. Bosque"),
      volatility: r.volatility,
      risk_label: r.risk_label,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volatilidad de precios por zona</CardTitle>
        <CardDescription>
          Variación porcentual del precio x m² en los últimos 3 meses — menor es más estable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="zone"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
              tickMargin={4}
              className="text-xs"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value}%`}
                />
              }
            />
            <Bar dataKey="volatility" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={riskColors[entry.risk_label]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-3">
          {Object.entries(riskColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-bold text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
