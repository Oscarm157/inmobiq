"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Icon } from "@/components/icon"
import { HeroHeader } from "@/components/hero-header"
import { getZoneComparisonData } from "@/lib/data/comparator"
import { useCurrency } from "@/contexts/currency-context"
import { ZoneSelector } from "@/components/comparar/zone-selector"
import { KpiCards } from "@/components/comparar/kpi-cards"
import { VerdictBanner } from "@/components/comparar/verdict-banner"
import { CollapsibleSection } from "@/components/comparar/collapsible-section"
import { TrendChart } from "@/components/comparar/trend-chart"
import { SummaryTable } from "@/components/comparar/summary-table"
import { EmptyState } from "@/components/comparar/empty-state"
import { ZoneRadarChart } from "@/components/comparar/radar-chart"
import { PriceAreaScatter } from "@/components/comparar/scatter-chart"
import { TypeDetailTable } from "@/components/comparar/type-detail-table"
import { VentaRentaZones } from "@/components/comparar/venta-renta-zones"
import { DemographicComparison } from "@/components/comparar/demographic-comparison"
import { MarketFilters } from "@/components/market-filters"
import type { ZoneMetrics } from "@/types/database"
import type { ZoneComparisonData } from "@/lib/data/comparator"
import type { ComparisonListing } from "@/lib/data/comparison-listings"
import type { ListingFilters } from "@/lib/data/listings"

const ZONE_COLORS = ["#4361ee", "#2a9d8f", "#e76f51", "#9b5de5"]

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
    if (!slugs.length) { setCompData(null); return }
    setLoading(true)
    try {
      const data = await getZoneComparisonData(allZones, slugs, filters)
      setCompData(data)
    } finally {
      setLoading(false)
    }
  }, [allZones, filters])

  useEffect(() => { fetchComparison(selectedSlugs) }, [selectedSlugs, fetchComparison])

  const updateUrl = (slugs: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slugs.length) params.set("zonas", slugs.join(","))
    else params.delete("zonas")
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

  const selectedZones = selectedSlugs
    .map((slug) => allZones.find((z) => z.zone_slug === slug))
    .filter(Boolean) as ZoneMetrics[]
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.zone_slug, z.zone_name]))
  const activeColors = ZONE_COLORS.slice(0, selectedZones.length)

  const copyShareUrl = () => { navigator.clipboard.writeText(window.location.href) }

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Header */}
      <HeroHeader
        badge="Comparador"
        badgeIcon="compare_arrows"
        title="Comparador de Zonas"
        subtitle="Análisis comparativo de variables inmobiliarias por zona en Tijuana."
        accent="blue"
        compact
        actions={
          <div className="flex items-center gap-3">
            <MarketFilters />
            {selectedSlugs.length > 1 && (
              <button
                onClick={copyShareUrl}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.08] backdrop-blur-sm text-white rounded-lg hover:bg-white/[0.14] transition-colors font-medium text-sm border border-white/[0.06]"
              >
                <Icon name="share" className="text-lg" />
                Compartir
              </button>
            )}
          </div>
        }
      />

      {/* Zone selector */}
      <ZoneSelector
        allZones={allZones}
        selectedSlugs={selectedSlugs}
        onAddZone={addZone}
        onRemoveZone={removeZone}
        onSelectPreset={selectPreset}
      />

      {/* Main content */}
      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
          <Icon name="progress_activity" className="animate-spin" />
          <span className="text-sm">Cargando datos…</span>
        </div>
      ) : selectedZones.length > 0 ? (
        <div className="space-y-4">
          {/* KPI Cards */}
          <KpiCards zones={selectedZones} colors={activeColors} />

          {/* Verdict Banner */}
          <VerdictBanner zones={selectedZones} colors={activeColors} />

          {/* Collapsible sections */}
          <CollapsibleSection
            title="Perfil de Zona"
            icon="radar"
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            preview="Comparativa multidimensional de desempeño"
            defaultOpen
          >
            <ZoneRadarChart zones={selectedZones} colors={activeColors} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Tendencia de Precios"
            icon="show_chart"
            iconColor="text-green-600"
            iconBg="bg-green-50 dark:bg-green-950/30"
            preview="Histórico de precio/m² — últimas 12 semanas"
            defaultOpen
          >
            {loading ? (
              <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
                <Icon name="progress_activity" className="animate-spin" />
                <span className="text-sm">Cargando tendencia…</span>
              </div>
            ) : compData?.trendSeries && compData.trendSeries.length > 0 ? (
              <TrendChart
                trendSeries={compData.trendSeries}
                slugs={selectedSlugs}
                zones={allZones}
                colors={activeColors}
              />
            ) : (
              <p className="text-sm text-slate-400 py-4">Sin datos de tendencia disponibles</p>
            )}
          </CollapsibleSection>

          {listings.length > 0 && (
            <CollapsibleSection
              title="Distribución Precio vs Área"
              icon="scatter_plot"
              preview="Scatter plot de propiedades individuales"
            >
              <PriceAreaScatter
                listings={listings}
                slugs={selectedSlugs}
                colors={activeColors}
                zoneNames={zoneNames}
              />
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Perfil Demográfico"
            icon="groups"
            preview="Datos censales INEGI 2020"
          >
            <DemographicComparison zones={selectedZones} colors={activeColors} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Desglose por Tipo"
            icon="home_work"
            preview="Casa, departamento, terreno, local, oficina"
          >
            <TypeDetailTable zones={selectedZones} colors={activeColors} />
          </CollapsibleSection>

          {listings.length > 0 && (
            <CollapsibleSection
              title="Venta vs Renta"
              icon="monetization_on"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              preview="Distribución y yield estimado"
            >
              <VentaRentaZones
                listings={listings}
                zones={selectedZones}
                colors={activeColors}
              />
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Tabla Comparativa"
            icon="table_chart"
            preview="Resumen de métricas clave"
          >
            <SummaryTable zones={selectedZones} colors={activeColors} />
          </CollapsibleSection>
        </div>
      ) : selectedSlugs.length > 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Icon name="compare" className="text-5xl" />
          <p className="text-sm">No hay datos disponibles para las zonas seleccionadas.</p>
        </div>
      ) : null}

      {/* Empty state */}
      {selectedSlugs.length === 0 && (
        <EmptyState allZones={allZones} onSelectPreset={selectPreset} />
      )}
    </div>
  )
}
