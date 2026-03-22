"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from "recharts"
import { useCurrency } from "@/contexts/currency-context"

export interface DensityBubble {
  zone_name: string
  zone_slug: string
  density: number       // population / ageb
  price_m2: number      // avg price per m2
  inventory: number     // total listings
  opportunity: number   // 0-100
}

interface MarketDensityScatterProps {
  data: DensityBubble[]
  colorBy?: "opportunity" | "risk"
  riskLabels?: Record<string, string> // zone_slug → risk label
}

function getBubbleColor(opportunity: number): string {
  if (opportunity >= 65) return "#10b981"
  if (opportunity >= 50) return "#22c55e"
  if (opportunity >= 40) return "#eab308"
  return "#f97316"
}

function getRiskColor(label?: string): string {
  if (label === "Bajo") return "#10b981"
  if (label === "Medio") return "#eab308"
  return "#ef4444"
}

function CustomTooltip({ active, payload, formatPrice, colorBy, riskLabels }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload as DensityBubble
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-black text-slate-800 dark:text-white mb-2">{d.zone_name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Densidad</span>
          <span className="font-bold">{d.density.toLocaleString("es-MX")} hab/AGEB</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Precio/m²</span>
          <span className="font-bold">{formatPrice(d.price_m2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Inventario</span>
          <span className="font-bold">{d.inventory} listings</span>
        </div>
        {colorBy === "opportunity" && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Oportunidad</span>
            <span className="font-bold">{d.opportunity}/100</span>
          </div>
        )}
        {colorBy === "risk" && riskLabels?.[d.zone_slug] && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Riesgo</span>
            <span className="font-bold">{riskLabels[d.zone_slug]}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function MarketDensityScatter({ data, colorBy = "opportunity", riskLabels }: MarketDensityScatterProps) {
  const { formatPrice } = useCurrency()

  if (data.length < 3) return null

  const medianDensity = [...data].sort((a, b) => a.density - b.density)[Math.floor(data.length / 2)]?.density ?? 0
  const medianPrice = [...data].sort((a, b) => a.price_m2 - b.price_m2)[Math.floor(data.length / 2)]?.price_m2 ?? 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
            Densidad de Mercado
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Población vs Precio — el tamaño indica inventario, el color {colorBy === "opportunity" ? "oportunidad" : "riesgo"}
          </p>
        </div>
      </div>

      {/* Quadrant labels */}
      <div className="relative">
        <div className="absolute top-2 left-[160px] text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider z-10">
          Alto precio · Baja densidad
        </div>
        <div className="absolute top-2 right-4 text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider z-10">
          Premium Establecido
        </div>
        <div className="absolute bottom-8 left-[160px] text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider z-10">
          Bajo precio · Baja densidad
        </div>
        <div className="absolute bottom-8 right-4 text-[9px] font-bold text-emerald-300 dark:text-emerald-800 uppercase tracking-wider z-10">
          Zona de Oportunidad
        </div>

        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="density"
                name="Densidad"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              >
                <Label value="Habitantes / AGEB" position="bottom" offset={0} style={{ fontSize: 10, fill: "#94a3b8" }} />
              </XAxis>
              <YAxis
                type="number"
                dataKey="price_m2"
                name="Precio/m²"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              >
                <Label value="Precio / m²" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 10, fill: "#94a3b8" }} />
              </YAxis>
              <ZAxis
                type="number"
                dataKey="inventory"
                range={[60, 400]}
                name="Inventario"
              />
              <Tooltip
                content={
                  <CustomTooltip
                    formatPrice={formatPrice}
                    colorBy={colorBy}
                    riskLabels={riskLabels}
                  />
                }
              />
              <ReferenceLine
                x={medianDensity}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={medianPrice}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              <Scatter data={data} name="Zonas">
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      colorBy === "risk"
                        ? getRiskColor(riskLabels?.[entry.zone_slug])
                        : getBubbleColor(entry.opportunity)
                    }
                    fillOpacity={0.7}
                    stroke={
                      colorBy === "risk"
                        ? getRiskColor(riskLabels?.[entry.zone_slug])
                        : getBubbleColor(entry.opportunity)
                    }
                    strokeOpacity={1}
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {colorBy === "opportunity" ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400">Alta oportunidad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-slate-400">Media</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] text-slate-400">Baja</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400">Riesgo bajo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-slate-400">Medio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-400">Alto</span>
            </div>
          </>
        )}
        <span className="text-[10px] text-slate-300 dark:text-slate-600 ml-auto">
          Tamaño = inventario activo
        </span>
      </div>
    </div>
  )
}
