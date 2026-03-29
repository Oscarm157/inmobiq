"use client"

import { useState, useEffect, useTransition, useCallback, useRef } from "react"
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
  Area,
  AreaChart,
} from "recharts"
import { Icon } from "@/components/icon"
import { getZoneComparisonData } from "@/lib/data/comparator"
import { useCurrency } from "@/contexts/currency-context"
import { ComparisonVerdict } from "@/components/comparar/comparison-verdict"
import { MetricBars } from "@/components/comparar/metric-bars"
import { CollapsibleSection } from "@/components/comparar/collapsible-section"
import { PriceAreaScatter } from "@/components/comparar/scatter-chart"
import { TypeDetailTable } from "@/components/comparar/type-detail-table"
import { VentaRentaZones } from "@/components/comparar/venta-renta-zones"
import { DemographicComparison } from "@/components/comparar/demographic-comparison"
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
    slugs: ["playas-de-tijuana", "cacho", "hipodromo"],
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

function ZoneCombobox({ zones, onSelect }: { zones: ZoneMetrics[]; onSelect: (slug: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = search.trim().length >= 1
    ? zones.filter((z) => z.zone_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
    : zones.sort((a, b) => a.zone_name.localeCompare(b.zone_name, "es"))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Icon name="add" className="text-base" />
        Agregar zona
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-64 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar zona..."
              autoFocus
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map((z) => (
              <button
                key={z.zone_slug}
                onClick={() => { onSelect(z.zone_slug); setOpen(false); setSearch("") }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                {z.zone_name}
              </button>
            )) : (
              <p className="px-4 py-3 text-xs text-slate-400">No se encontraron zonas</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
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
  const selectedZones = selectedSlugs
    .map((slug) => allZones.find((z) => z.zone_slug === slug))
    .filter(Boolean) as ZoneMetrics[]
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.zone_slug, z.zone_name]))

  const copyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="space-y-6 pb-20">
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
            <ZoneCombobox zones={availableToAdd} onSelect={addZone} />
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400">
            {selectedSlugs.length}/4 zonas seleccionadas
          </p>
          <div className="flex gap-2">
            {PRESET_COMPARISONS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => selectPreset(preset.slugs)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
              >
                <Icon name={preset.icon} className="text-xs" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
          <Icon name="progress_activity" className="animate-spin" />
          <span className="text-sm">Cargando datos…</span>
        </div>
      ) : selectedZones.length > 0 ? (
        <>
          {/* 1. Verdict hero */}
          <ComparisonVerdict
            zones={selectedZones}
            colors={ZONE_COLORS.slice(0, selectedZones.length)}
          />

          {/* 2. Metric bars */}
          <MetricBars
            zones={selectedZones}
            colors={ZONE_COLORS.slice(0, selectedZones.length)}
          />

          {/* 3. Collapsible: Mercado */}
          <CollapsibleSection
            title="Evolución de Mercado"
            subtitle="Tendencia de precio/m² y distribución precio vs superficie"
            icon="show_chart"
            defaultOpen
          >
            <div className="space-y-6">
              {/* Price trend chart */}
              {loading && (
                <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
                  <Icon name="progress_activity" className="animate-spin" />
                  <span className="text-sm">Cargando tendencia…</span>
                </div>
              )}
              {!loading && compData?.trendSeries && compData.trendSeries.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Precio/m² — últimas 12 semanas
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={compData.trendSeries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        {selectedSlugs.map((slug, i) => (
                          <linearGradient key={slug} id={`grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ZONE_COLORS[i]} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={ZONE_COLORS[i]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
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
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
                              <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
                              {payload.map((p) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {formatPrice(p.value as number)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      {selectedSlugs.map((slug, i) => {
                        const zone = allZones.find((z) => z.zone_slug === slug)
                        return (
                          <Area
                            key={slug}
                            type="monotone"
                            dataKey={slug}
                            name={zone?.zone_name ?? slug}
                            stroke={ZONE_COLORS[i]}
                            strokeWidth={2.5}
                            fill={`url(#grad-${slug})`}
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }}
                          />
                        )
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Scatter plot */}
              {listings.length > 0 && (
                <PriceAreaScatter
                  listings={listings}
                  slugs={selectedSlugs}
                  colors={ZONE_COLORS.slice(0, selectedSlugs.length)}
                  zoneNames={zoneNames}
                  embedded
                />
              )}
            </div>
          </CollapsibleSection>

          {/* 4. Collapsible: Tipos y Operación */}
          <CollapsibleSection
            title="Tipos de Propiedad y Operación"
            subtitle="Desglose por tipo de inmueble y proporción venta vs renta"
            icon="category"
          >
            <div className="space-y-6">
              <TypeDetailTable
                zones={selectedZones}
                colors={ZONE_COLORS.slice(0, selectedZones.length)}
                embedded
              />
              {listings.length > 0 && (
                <VentaRentaZones
                  listings={listings}
                  zones={selectedZones}
                  colors={ZONE_COLORS.slice(0, selectedZones.length)}
                  embedded
                />
              )}
            </div>
          </CollapsibleSection>

          {/* 5. Collapsible: Demografía */}
          <CollapsibleSection
            title="Perfil Demográfico"
            subtitle="Indicadores socioeconómicos del Censo 2020"
            icon="groups"
          >
            <DemographicComparison
              zones={selectedZones}
              colors={ZONE_COLORS.slice(0, selectedZones.length)}
              embedded
            />
          </CollapsibleSection>
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
