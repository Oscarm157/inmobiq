"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  count: {
    label: "Propiedades",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

interface PropertyTypeChartProps {
  data: Array<{ type: string; count: number; ticket: number }>
}

export function PropertyTypeChart({ data }: PropertyTypeChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="type"
          type="category"
          tickLine={false}
          axisLine={false}
          width={110}
          className="text-xs"
        />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const ticket = item?.payload?.ticket
                return `${value} propiedades — Ticket: ${formatCurrency(ticket)}`
              }}
            />
          }
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
