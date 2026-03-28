"use client"

import { useState } from "react"
import { EmptyState } from "@/components/empty-state"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"

const TYPE_COLORS: Record<string, string> = {
  departamento: "#7c3aed",
  casa: "#2563eb",
  terreno: "#059669",
  local: "#d97706",
  oficina: "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  departamento: "Depto",
  casa: "Casa",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

const chartConfig = {
  price: { label: "Precio", color: "#2563eb" },
} satisfies ChartConfig

export interface ScatterPoint {
  area: number
  price: number
  type: string
  title: string
  /** Dev-only fields for drill-down */
  id?: string
  listing_type?: string
  price_per_m2?: number
  bedrooms?: number | null
  bathrooms?: number | null
  source?: string
  source_url?: string
  area_construccion_m2?: number | null
  area_terreno_m2?: number | null
}

interface PriceAreaScatterProps {
  data: ScatterPoint[]
  availableTypes: string[]
  /** Dev mode: enable point inspection */
  devMode?: boolean
  zoneSlug?: string
}

export function PriceAreaScatter({ data, availableTypes, devMode, zoneSlug }: PriceAreaScatterProps) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(availableTypes))
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  if (!data.length) return <EmptyState icon="scatter_plot" description="No hay propiedades con precio y superficie para graficar." />

  const filteredData = data.filter((d) => activeTypes.has(d.type))

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const formatPrice = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }

  const selected = selectedIdx !== null ? filteredData[selectedIdx] : null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Precio vs Superficie</h3>
          <InfoTooltip content="Cada punto es una propiedad activa. Eje X = superficie en m², eje Y = precio. Los puntos hacia abajo-derecha representan mejor valor (más metros por menos precio). Se filtran outliers con método IQR ×2 para evitar distorsiones." />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          ¿Pagas más por más metros? Cada punto = 1 propiedad · Abajo-derecha = más m² por menos precio (mejor valor)
          {devMode && <span className="text-amber-500 ml-1">· clic en punto para inspeccionar</span>}
        </p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableTypes.map((type) => {
          const active = activeTypes.has(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                transition-all duration-200 border
                ${active
                  ? "border-transparent text-white shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 bg-transparent hover:border-slate-300"
                }
              `}
              style={active ? { backgroundColor: TYPE_COLORS[type] ?? "#6b7280" } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] ?? "#6b7280", opacity: active ? 1 : 0.3 }}
              />
              {TYPE_LABELS[type] ?? type}
            </button>
          )
        })}
      </div>

      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="area"
            type="number"
            name="m²"
            tickLine={false}
            axisLine={false}
            className="text-[10px]"
            tickFormatter={(v: number) => `${v}m²`}
          />
          <YAxis
            dataKey="price"
            type="number"
            name="Precio"
            tickLine={false}
            axisLine={false}
            className="text-[10px]"
            tickFormatter={formatPrice}
            width={60}
          />
          <Scatter
            data={filteredData}
            cursor={devMode ? "pointer" : undefined}
            onClick={devMode ? (_: unknown, index: number) => {
              setSelectedIdx((prev) => prev === index ? null : index)
            } : undefined}
          >
            {filteredData.map((entry, i) => (
              <Cell
                key={i}
                fill={TYPE_COLORS[entry.type] ?? "#6b7280"}
                fillOpacity={selectedIdx === i ? 0.9 : 0.45}
                stroke={TYPE_COLORS[entry.type] ?? "#6b7280"}
                strokeOpacity={selectedIdx === i ? 1 : 0.7}
                strokeWidth={selectedIdx === i ? 2 : 1}
                r={selectedIdx === i ? 18 : 14}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>

      {/* Dev: Selected point detail */}
      {devMode && selected?.id && (
        <div className="mt-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon name="bug_report" className="text-amber-600 text-sm" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">DEV · Detalle del punto</span>
            </div>
            <button onClick={() => setSelectedIdx(null)} className="text-amber-500 hover:text-amber-700">
              <Icon name="close" className="text-sm" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><span className="text-amber-600 font-bold">Título:</span> {selected.title}</div>
            <div><span className="text-amber-600 font-bold">Tipo:</span> {TYPE_LABELS[selected.type] ?? selected.type}</div>
            <div>
              <span className="text-amber-600 font-bold">Op:</span>{" "}
              <span className={selected.listing_type === "renta" ? "text-orange-600 font-bold" : ""}>
                {selected.listing_type ?? "—"}
              </span>
            </div>
            <div><span className="text-amber-600 font-bold">Precio:</span> {formatPrice(selected.price)}</div>
            <div><span className="text-amber-600 font-bold">Área:</span> {selected.area}m²{selected.type === "casa" && selected.area_construccion_m2 && selected.area_terreno_m2 && selected.area_construccion_m2 !== selected.area_terreno_m2 ? ` (constr. ${Math.round(selected.area_construccion_m2)} · terr. ${Math.round(selected.area_terreno_m2)})` : ""}</div>
            <div><span className="text-amber-600 font-bold">$/m²:</span> {selected.price_per_m2 ? formatPrice(Math.round(selected.price_per_m2)) : "—"}</div>
            <div><span className="text-amber-600 font-bold">Rec:</span> {selected.bedrooms ?? "—"}</div>
            <div>
              <span className="text-amber-600 font-bold">Fuente:</span>{" "}
              {selected.source_url && selected.source_url !== "#" ? (
                <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selected.source}</a>
              ) : (selected.source ?? "—")}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
