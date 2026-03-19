"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { TIJUANA_ZONES } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  avg_price_per_m2: {
    label: "Precio x m²",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

const data = [...TIJUANA_ZONES]
  .sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
  .map((z) => ({
    zone: z.zone_name,
    avg_price_per_m2: z.avg_price_per_m2,
  }))

export function ZonesBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa de zonas</CardTitle>
        <CardDescription>
          Precio promedio por metro cuadrado en cada zona de Tijuana
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
              width={130}
              tickMargin={4}
              className="text-xs"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />
            <Bar
              dataKey="avg_price_per_m2"
              fill="var(--color-avg_price_per_m2)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
