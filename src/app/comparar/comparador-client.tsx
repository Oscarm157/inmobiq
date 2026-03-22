"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Icon } from "@/components/icon"
import { getZoneComparisonData } from "@/lib/data/comparator"
import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import { ZoneRadarChart } from "@/components/comparar/radar-chart"
import { PriceAreaScatter } from "@/components/comparar/scatter-chart"
import { TypeDetailTable } from "@/components/comparar/type-detail-table"
import { VentaRentaZones } from "@/components/comparar/venta-renta-zones"
import { MarketFilters } from "@/components/market-filters"
import type { ZoneMetrics } from "@/types/database"
import type { ZoneComparisonData } from "@/lib/data/comparator"
import type { ComparisonListing } from "@/lib/data/comparison-listings"
import type { ListingFilters } from "@/lib/data/listings"

const ZONE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b"]

const PRESET_COMPARISONS = [
  {
    label: "Premium vs Económico",
    icon: "balance",
    slugs: ["playas-de-tijuana", "zona-rio", "otay", "centro"],
    description: "Las zonas más caras vs las más accesibles",
  },
  {
    label: "Alta Plusvalía",
    icon: "trending_up",
    slugs: ["playas-de-tijuana", "residencial-del-bosque", "chapultepec"],
    description: "Zonas con mayor tendencia positiva de precios",
  },
  {
    label: "Mayor Inventario",
    icon: "inventory_2",
    slugs: ["zona-rio", "playas-de-tijuana", "centro", "la-mesa"],
    description: "Zonas con más propiedades activas",
  },
]

interface ComparadorClientProps {
  allZones: ZoneMetrics[]
  initialSlugs: string[]
  initialListings: ComparisonListing[]
  filters: ListingFilters
}

export function ComparadorClient({ allZones, initialSlugs, initialListings, filters }: ComparadorClientProps) {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs)
  const [compData, setCompData] = useState<ZoneComparisonData | null>(null)
  const [listings] = useState<ComparisonListing[]>(initialListings)
  const [loading, setLoading] = useState(false)

  const fetchComparison = useCallback(async (slugs: string[]) => {
    if (!slugs.length) {
      setCompData(null)
      return
    }
    setLoading(true)
    try {
      const data = await getZoneComparisonData(allZones, slugs, filters)
      setCompData(data)
    } finally {
      setLoading(false)
    }
  }, [allZones, filters])

  useEffect(() => {
    fetchComparison(selectedSlugs)
  }, [selectedSlugs, fetchComparison])

  const updateUrl = (slugs: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slugs.length) {
      params.set("zonas", slugs.join(","))
    } else {
      params.delete("zonas")
    }
    startTransition(() => {
      router.replace(`/comparar?${params.toString()}`, { scroll: false })
    })
  }

  const addZone = (slug: string) => {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 4) return
    const next = [...selectedSlugs, slug]
    setSelectedSlugs(next)
    updateUrl(next)
  }

  const removeZone = (slug: string) => {
    const next = selectedSlugs.filter((s) => s !== slug)
    setSelectedSlugs(next)
    updateUrl(next)
  }

  const selectPreset = (slugs: string[]) => {
    setSelectedSlugs(slugs)
    updateUrl(slugs)
  }

  const availableToAdd = allZones.filter((z) => !selectedSlugs.includes(z.zone_slug))
  const selectedZones = compData?.zones ?? []
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.zone_slug, z.zone_name]))

  const copyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Comparador de Zonas</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Selecciona hasta 4 zonas para comparar sus métricas lado a lado.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <MarketFilters />
            {selectedSlugs.length > 1 && (
              <button
                onClick={copyShareUrl}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Icon name="share" className="text-base" />
                Compartir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zone selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {selectedSlugs.map((slug, i) => {
            const zone = allZones.find((z) => z.zone_slug === slug)
            return (
              <span
                key={slug}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: ZONE_COLORS[i] }}
              >
                {zone?.zone_name ?? slug}
                <button
                  onClick={() => removeZone(slug)}
                  aria-label={`Quitar ${zone?.zone_name ?? slug}`}
                  className="ml-0.5 opacity-80 hover:opacity-100"
                >
                  <Icon name="close" className="text-xs" />
                </button>
              </span>
            )
          })}
          {selectedSlugs.length < 4 && availableToAdd.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Icon name="add" className="text-base" />
                Agregar zona
              </button>
              <div className="absolute top-full mt-1 left-0 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-48 hidden group-hover:block group-focus-within:block">
                {availableToAdd.map((z) => (
                  <button
                    key={z.zone_slug}
                    onClick={() => addZone(z.zone_slug)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    {z.zone_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {selectedSlugs.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Ninguna zona seleccionada. Elige una comparación sugerida o agrega zonas manualmente.
          </p>
        )}
      </div>

      {loading || isPending ? (
        <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
          <Icon name="progress_activity" className="animate-spin" />
          <span className="text-sm">Cargando datos…</span>
        </div>
      ) : selectedZones.length > 0 ? (
        <>
          {/* 1. Side-by-side metrics */}
          <div className={`grid gap-4 ${selectedZones.length === 2 ? "grid-cols-2" : selectedZones.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
            {selectedZones.map((zone, i) => (
              <div
                key={zone.zone_slug}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm"
              >
                <div
                  className="w-3 h-3 rounded-full mb-1"
                  style={{ backgroundColor: ZONE_COLORS[i] }}
                />
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                  {zone.zone_name}
                </h3>

                <div className="space-y-3">
                  <MetricRow
                    label="Precio/m²"
                    value={formatPrice(zone.avg_price_per_m2)}
                    sub={`Tendencia ${formatPercent(zone.price_trend_pct)}`}
                    trendPositive={zone.price_trend_pct >= 0}
                  />
                  <MetricRow
                    label="Inventario"
                    value={getZoneActivityLabel(zone.total_listings)}
                    sub="nivel de actividad"
                  />
                  <MetricRow
                    label="Ticket promedio"
                    value={formatPrice(zone.avg_ticket)}
                    sub="por propiedad"
                  />
                </div>

                {/* Property type breakdown */}
                {zone.listings_by_type && Object.keys(zone.listings_by_type).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                      Distribución
                    </p>
                    <div className="space-y-1">
                      {Object.entries(zone.listings_by_type)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: ZONE_COLORS[i],
                                  width: `${Math.min(100, (count / zone.total_listings) * 100)}%`,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 w-24 text-right capitalize">
                              {type} {Math.round((count / zone.total_listings) * 100)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2. Radar chart */}
          <ZoneRadarChart zones={selectedZones} colors={ZONE_COLORS.slice(0, selectedZones.length)} />

          {/* 3. Price trend chart */}
          {compData?.trendSeries && compData.trendSeries.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-5">
                Evolución de precio/m² — últimas 12 semanas
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={compData.trendSeries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "$/m²"]}
                    contentStyle={{
                      backgroundColor: "var(--color-bg, white)",
                      border: "1px solid rgba(100,116,139,0.2)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {selectedSlugs.map((slug, i) => {
                    const zone = allZones.find((z) => z.zone_slug === slug)
                    return (
                      <Line
                        key={slug}
                        type="monotone"
                        dataKey={slug}
                        name={zone?.zone_name ?? slug}
                        stroke={ZONE_COLORS[i]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 4. Scatter plot */}
          {listings.length > 0 && (
            <PriceAreaScatter
              listings={listings}
              slugs={selectedSlugs}
              colors={ZONE_COLORS.slice(0, selectedSlugs.length)}
              zoneNames={zoneNames}
            />
          )}

          {/* 5. Type detail table */}
          <TypeDetailTable
            zones={selectedZones}
            colors={ZONE_COLORS.slice(0, selectedZones.length)}
          />

          {/* 6. Venta vs Renta */}
          {listings.length > 0 && (
            <VentaRentaZones
              listings={listings}
              zones={selectedZones}
              colors={ZONE_COLORS.slice(0, selectedZones.length)}
            />
          )}

          {/* 7. Summary comparison table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Tabla comparativa
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Métrica
                    </th>
                    {selectedZones.map((z, i) => (
                      <th
                        key={z.zone_slug}
                        className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: ZONE_COLORS[i] }}
                      >
                        {z.zone_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <TableRow
                    label="Precio/m²"
                    values={selectedZones.map((z) => formatPrice(z.avg_price_per_m2))}
                    highlight={selectedZones.map((z) => z.avg_price_per_m2)}
                  />
                  <TableRow
                    label="Tendencia"
                    values={selectedZones.map((z) => formatPercent(z.price_trend_pct))}
                    highlight={selectedZones.map((z) => z.price_trend_pct)}
                    higherIsBetter
                  />
                  <TableRow
                    label="Inventario"
                    values={selectedZones.map((z) => getZoneActivityLabel(z.total_listings))}
                    highlight={selectedZones.map((z) => z.total_listings)}
                    higherIsBetter
                  />
                  <TableRow
                    label="Ticket promedio"
                    values={selectedZones.map((z) => formatPrice(z.avg_ticket))}
                    highlight={selectedZones.map((z) => z.avg_ticket)}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        selectedSlugs.length > 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Icon name="compare" className="text-5xl" />
            <p className="text-sm">No hay datos disponibles para las zonas seleccionadas.</p>
          </div>
        )
      )}

      {/* Empty state with preset suggestions */}
      {selectedSlugs.length === 0 && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <Icon name="compare" className="text-5xl text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Selecciona una comparación sugerida o agrega zonas manualmente
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRESET_COMPARISONS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => selectPreset(preset.slugs)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
                    <Icon name={preset.icon} className="text-xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{preset.label}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.slugs.map((slug, i) => (
                    <span
                      key={slug}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: ZONE_COLORS[i] }}
                    >
                      {allZones.find((z) => z.zone_slug === slug)?.zone_name ?? slug}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricRow({
  label,
  value,
  sub,
  trendPositive,
}: {
  label: string
  value: string
  sub?: string
  trendPositive?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs mt-0.5 ${
            trendPositive === undefined
              ? "text-slate-400 dark:text-slate-500"
              : trendPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

function TableRow({
  label,
  values,
  highlight,
  higherIsBetter = false,
}: {
  label: string
  values: string[]
  highlight: number[]
  higherIsBetter?: boolean
}) {
  const best = higherIsBetter ? Math.max(...highlight) : Math.min(...highlight)

  return (
    <tr>
      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{label}</td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`px-6 py-3.5 text-right font-semibold ${
            highlight[i] === best
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {val}
          {highlight[i] === best && (
            <span className="ml-1 text-xs">★</span>
          )}
        </td>
      ))}
    </tr>
  )
}
