"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useCurrency } from "@/contexts/currency-context"
import type { ComparisonListing } from "@/lib/data/comparison-listings"

interface PriceAreaScatterProps {
  listings: ComparisonListing[]
  slugs: string[]
  colors: string[]
  zoneNames: Record<string, string>
}

export function PriceAreaScatter({ listings, slugs, colors, zoneNames }: PriceAreaScatterProps) {
  const { formatPrice } = useCurrency()

  if (listings.length === 0) return null

  const groupedByZone = slugs.map((slug) =>
    listings
      .filter((l) => l.zone_slug === slug && l.area_m2 > 0 && l.price > 0)
      .map((l) => ({ x: l.area_m2, y: l.price, type: l.property_type }))
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
        Precio vs Superficie
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Cada punto es una propiedad individual. Compara densidad y distribución.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
          <XAxis
            type="number"
            dataKey="x"
            name="Área"
            unit=" m²"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-slate-500 dark:text-slate-400"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Precio"
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`
            }
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-slate-500 dark:text-slate-400"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]?.payload as { x: number; y: number; type: string } | undefined
              if (!p) return null
              return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs">
                  <p className="font-bold">{formatPrice(p.y)}</p>
                  <p className="text-slate-500">{p.x} m² · {p.type}</p>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {slugs.map((slug, i) => (
            <Scatter
              key={slug}
              name={zoneNames[slug] ?? slug}
              data={groupedByZone[i]}
              fill={colors[i]}
              fillOpacity={0.6}
              r={4}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
