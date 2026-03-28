"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts"
import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import type { TrendPoint } from "@/lib/data/trend-data"

interface PriceTrendChartProps {
  data: TrendPoint[]
  var4w: number
  var10w: number
  momentum: "confirmado" | "divergente" | "estable"
  realWeeks: number
}

export function PriceTrendChart({ data, var4w, var10w, momentum, realWeeks }: PriceTrendChartProps) {
  const { formatPrice, convert } = useCurrency()

  if (!data.length) return null

  const isPositive = var10w >= 0
  const areaColor = isPositive ? "#10b981" : "#ef4444"
  const areaColorLight = isPositive ? "#10b98120" : "#ef444420"

  const chartData = data.map((p) => ({
    week: new Date(p.weekStart).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    price: Math.round(convert(p.pricePerM2)),
    isReal: p.isReal,
    raw: p.pricePerM2,
  }))

  const lastPoint = chartData[chartData.length - 1]

  const momentumLabel = momentum === "confirmado" ? "Tendencia confirmada" : momentum === "divergente" ? "Tendencia divergente" : "Estable"
  const momentumIcon = momentum === "confirmado" ? "verified" : momentum === "divergente" ? "sync_alt" : "horizontal_rule"
  const momentumColor = momentum === "confirmado" ? (isPositive ? "text-emerald-600" : "text-red-600") : momentum === "divergente" ? "text-amber-600" : "text-slate-500"

  return (
    <div className="space-y-4">
      {/* Trend KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">4 semanas</p>
          <p className={`text-lg font-black ${var4w >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {var4w >= 0 ? "+" : ""}{var4w}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">10 semanas</p>
          <p className={`text-lg font-black ${var10w >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {var10w >= 0 ? "+" : ""}{var10w}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Momentum</p>
          <p className={`text-sm font-bold flex items-center gap-1 ${momentumColor}`}>
            <Icon name={momentumIcon} className="text-sm" />
            {momentumLabel}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Precio / m² — Últimas 10 semanas
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Evolución semanal del precio promedio por metro cuadrado
            </p>
          </div>
          {realWeeks < 4 && (
            <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded-full">
              Datos históricos limitados
            </span>
          )}
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload as typeof chartData[0]
                  return (
                    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
                      <p className="font-bold">{d.week}</p>
                      <p>{formatPrice(d.raw)}/m²</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={areaColor}
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={false}
                activeDot={{ r: 5, fill: areaColor, strokeWidth: 0 }}
              />
              {lastPoint && (
                <ReferenceDot
                  x={lastPoint.week}
                  y={lastPoint.price}
                  r={5}
                  fill={areaColor}
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
