"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
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
import type { ZoneMetrics } from "@/types/database"

const chartConfig = {
  casa: { label: "Casa", color: "#2563eb" },
  departamento: { label: "Depto", color: "#7c3aed" },
  terreno: { label: "Terreno", color: "#059669" },
  local: { label: "Local", color: "#d97706" },
  oficina: { label: "Oficina", color: "#6b7280" },
} satisfies ChartConfig

interface InventoryTypeChartProps {
  zones: ZoneMetrics[]
}

export function InventoryTypeChart({ zones }: InventoryTypeChartProps) {
  const data = [...zones]
    .sort((a, b) => b.total_listings - a.total_listings)
    .map((z) => {
      const types = z.listings_by_type as Record<string, number>
      const total = z.total_listings || 1
      return {
        zone: z.zone_name.replace("Residencial del Bosque", "Res. Bosque"),
        casa: Math.round(((types?.casa ?? 0) / total) * 100),
        departamento: Math.round(((types?.departamento ?? 0) / total) * 100),
        terreno: Math.round(((types?.terreno ?? 0) / total) * 100),
        local: Math.round(((types?.local ?? 0) / total) * 100),
        oficina: Math.round(((types?.oficina ?? 0) / total) * 100),
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de inventario por tipo</CardTitle>
        <CardDescription>
          Composición porcentual del mercado por tipo de propiedad en cada zona
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
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
            <XAxis type="number" tickLine={false} axisLine={false} />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
            />
            <Bar dataKey="departamento" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="casa" stackId="a" fill="#2563eb" />
            <Bar dataKey="local" stackId="a" fill="#d97706" />
            <Bar dataKey="terreno" stackId="a" fill="#059669" />
            <Bar dataKey="oficina" stackId="a" fill="#6b7280" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
