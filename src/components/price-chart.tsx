"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { PRICE_TREND_DATA } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  avg_price_m2: {
    label: "Precio x m²",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

export function PriceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de precio x m²</CardTitle>
        <CardDescription>
          Evolución del precio promedio por metro cuadrado en Tijuana — últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={PRICE_TREND_DATA}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              domain={["dataMin - 1000", "dataMax + 500"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                  indicator="line"
                />
              }
            />
            <defs>
              <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-avg_price_m2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-avg_price_m2)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="avg_price_m2"
              stroke="var(--color-avg_price_m2)"
              strokeWidth={2}
              fill="url(#fillPrice)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
