import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Icon } from "@/components/icon"
import { ExportButton } from "@/components/export-button"
import { EditorialCard } from "@/components/editorial-card"
import { PipelineCard, PIPELINE_PROJECTS } from "@/components/pipeline-card"
import { ZoneMapWrapper } from "@/components/map/zone-map-wrapper"
import { KPITickerStrip } from "@/components/zone/kpi-ticker-strip"
import { PropertyCompositionChart } from "@/components/zone/property-composition-chart"
import { PriceByTypeChart } from "@/components/zone/price-by-type-chart"
import { ZoneDNACard } from "@/components/zone/zone-dna-card"
import { ZoneComparisonEnhanced } from "@/components/zone/zone-comparison-enhanced"
import { PriceDistributionChart } from "@/components/zone/price-distribution-chart"
import { PriceAreaScatter } from "@/components/zone/price-area-scatter"
import { VentaRentaComparison } from "@/components/zone/venta-renta-comparison"
import { MarketQualityCard } from "@/components/zone/market-quality-card"
import { DemographicsCard } from "@/components/zone/demographics-card"
import { ZoneInsightsCard } from "@/components/zone/zone-insights-card"
import { ZoneFilters } from "@/components/zone/zone-filters"
import { getZoneDemographics } from "@/lib/data/demographics"
import { computeZoneInsights } from "@/lib/data/zone-insights"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { PriceByBedroomsChart } from "@/components/zone/price-by-bedrooms-chart"
import { CasaVsDepto } from "@/components/zone/casa-vs-depto"
import { getZoneMetrics, getZoneBySlug, getCityMetrics } from "@/lib/data/zones"
import { getListings, getZoneListingsAnalytics } from "@/lib/data/listings"
import type { ListingFilters } from "@/lib/data/listings"
import { formatCurrency } from "@/lib/utils"
import { filterNormalizedListings, removeOutliers } from "@/lib/data/normalize"
import type { PropertyType, ListingType, ZoneMetrics, Listing } from "@/types/database"
import type { PropertyCategory } from "@/lib/data/normalize"

const PROPERTY_LABELS: Record<PropertyType, string> = {
  casa: "Casas",
  departamento: "Departamentos",
  terreno: "Terrenos",
  local: "Locales",
  oficina: "Oficinas",
}

interface ZoneSearchParams {
  operacion?: string
  categoria?: string
}

interface ZonePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<ZoneSearchParams>
}

export async function generateStaticParams() {
  const zones = await getZoneMetrics()
  return zones.map((zone) => ({ slug: zone.zone_slug }))
}

export async function generateMetadata({ params }: ZonePageProps) {
  const { slug } = await params
  const zone = await getZoneBySlug(slug)
  if (!zone) return {}
  return {
    title: `${zone.zone_name} — Inmobiq`,
    description: `Análisis estratégico del mercado inmobiliario en ${zone.zone_name}, Tijuana. Precio promedio: ${formatCurrency(zone.avg_price_per_m2)}/m².`,
  }
}

export default async function ZonePage({ params, searchParams }: ZonePageProps) {
  const { slug } = await params
  const sp = await searchParams

  // Parse filters with investor-friendly defaults: venta + residencial
  const VALID_OPS = new Set(["venta", "renta", "todas"])
  const VALID_CATS = new Set(["residencial", "comercial", "terreno", "todas"])

  const rawOp = sp.operacion && VALID_OPS.has(sp.operacion) ? sp.operacion : "venta"
  const rawCat = sp.categoria && VALID_CATS.has(sp.categoria) ? sp.categoria : "residencial"

  const filters: ListingFilters = {
    zonas: [slug],
    listing_type: rawOp !== "todas" ? (rawOp as ListingType) : undefined,
    categoria: rawCat !== "todas" ? (rawCat as PropertyCategory) : undefined,
  }

  const [zone, city, allZones, { listings }, zoneAnalytics, riskMetrics] = await Promise.all([
    getZoneBySlug(slug, filters),
    getCityMetrics(filters),
    getZoneMetrics(),
    getListings(filters),
    getZoneListingsAnalytics(slug, filters),
    getZoneRiskMetrics(),
  ])
  if (!zone) notFound()

  // Normalize: filter out invalid pricing
  const normalizedListings = filterNormalizedListings(listings as Listing[])

  const cityAvg = city.avg_price_per_m2

  // Determine top property type
  const sortedTypes = Object.entries(zone.listings_by_type).sort(
    ([, a], [, b]) => b - a
  )
  const topType = sortedTypes[0]
  const topTypeKey = topType[0] as PropertyType
  const topLabel = PROPERTY_LABELS[topTypeKey].toLowerCase()
  const topPct = zone.total_listings > 0
    ? Math.round((topType[1] / zone.total_listings) * 100)
    : 0

  // Absorption rate
  const absorptionPct = Math.min(
    95,
    Math.round(50 + zone.price_trend_pct * 5 + (zone.total_listings > 200 ? 10 : 0))
  )

  // Generate editorial content
  const mainText = generateMainText(zone, cityAvg, topLabel, topType[1])
  const quote = generateQuote(zone)

  // Badges
  const badges: { label: string; color: string }[] = []
  if (zone.avg_price_per_m2 > cityAvg * 1.1) {
    badges.push({ label: "Premium District", color: "bg-slate-100 text-slate-800 dark:bg-blue-950 dark:text-blue-300" })
  }
  if (zone.price_trend_pct > 4) {
    badges.push({ label: "High Demand", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" })
  }
  if (zone.price_trend_pct < 0) {
    badges.push({ label: "Price Correction", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" })
  }
  if (zone.total_listings > 200) {
    badges.push({ label: "High Volume", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" })
  }

  // --- Composition chart data (índice de concentración 0-10) ---
  const maxCount = Math.max(...Object.values(zone.listings_by_type), 1)
  const compositionData = Object.entries(zone.listings_by_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => {
      const score = Math.round((count / maxCount) * 100) / 10 // 0-10 scale
      return {
        type: PROPERTY_LABELS[type as PropertyType],
        typeKey: type,
        score,
        label: `${score.toFixed(1)}`,
      }
    })
    .sort((a, b) => b.score - a.score)

  // --- Price by type chart data ---
  const priceByTypeData = Object.entries(zone.avg_ticket_by_type)
    .filter(([type]) => (zone.listings_by_type[type as PropertyType] ?? 0) > 0)
    .map(([type, avgTicket]) => ({
      type: PROPERTY_LABELS[type as PropertyType],
      typeKey: type,
      avgTicket: Math.round(avgTicket),
      label: formatCurrency(Math.round(avgTicket)),
    }))
    .sort((a, b) => b.avgTicket - a.avgTicket)

  // --- ADN de la Zona data ---
  const typedListings = normalizedListings.filter(
    (l) => l.property_type === topTypeKey
  )
  const avgArea =
    typedListings.length > 0
      ? typedListings.reduce((s, l) => s + (l.area_m2 || 0), 0) / typedListings.length
      : 0
  const withBedrooms = typedListings.filter((l) => l.bedrooms != null)
  const avgBedrooms =
    withBedrooms.length > 0
      ? withBedrooms.reduce((s, l) => s + l.bedrooms!, 0) / withBedrooms.length
      : null
  const withBathrooms = typedListings.filter((l) => l.bathrooms != null)
  const avgBathrooms =
    withBathrooms.length > 0
      ? withBathrooms.reduce((s, l) => s + l.bathrooms!, 0) / withBathrooms.length
      : null

  // --- Clean data for charts (remove statistical outliers) ---
  const allListings = normalizedListings
  const chartListings = removeOutliers(allListings, (l) => l.price)

  // --- Price distribution data (use clean set) ---
  const priceRanges = [
    { min: 0, max: 1_000_000, range: "<$1M" },
    { min: 1_000_000, max: 3_000_000, range: "$1M–3M" },
    { min: 3_000_000, max: 5_000_000, range: "$3M–5M" },
    { min: 5_000_000, max: 10_000_000, range: "$5M–10M" },
    { min: 10_000_000, max: 20_000_000, range: "$10M–20M" },
    { min: 20_000_000, max: Infinity, range: ">$20M" },
  ]
  const priceDistData = priceRanges
    .map((r) => {
      const count = chartListings.filter((l) => l.price >= r.min && l.price < r.max).length
      const pct = chartListings.length > 0 ? Math.round((count / chartListings.length) * 100) : 0
      return { range: r.range, count, label: count > 0 ? `${pct}%` : "" }
    })
    .filter((d) => d.count > 0)

  // --- Scatter data (m² vs price, outlier-cleaned) ---
  const scatterData = chartListings
    .filter((l) => l.area_m2 > 0 && l.price > 0)
    .map((l) => ({
      area: Math.round(l.area_m2),
      price: Math.round(l.price),
      type: l.property_type,
      title: l.title,
    }))
  const scatterTypes = [...new Set(scatterData.map((d) => d.type))]

  // --- Venta vs Renta data ---
  const ventaListings = allListings.filter((l) => l.listing_type === "venta")
  const rentaListings = allListings.filter((l) => l.listing_type === "renta")
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const ventaRentaData = {
    ventaCount: ventaListings.length,
    rentaCount: rentaListings.length,
    ventaAvgPrice: avg(ventaListings.map((l) => l.price)),
    rentaAvgPrice: avg(rentaListings.map((l) => l.price)),
    ventaAvgPriceM2: avg(ventaListings.filter((l) => l.price_per_m2 > 0).map((l) => l.price_per_m2)),
    rentaAvgPriceM2: avg(rentaListings.filter((l) => l.price_per_m2 > 0).map((l) => l.price_per_m2)),
    ventaAvgArea: avg(ventaListings.filter((l) => l.area_m2 > 0).map((l) => l.area_m2)),
    rentaAvgArea: avg(rentaListings.filter((l) => l.area_m2 > 0).map((l) => l.area_m2)),
  }

  // --- Market quality data (extracted from raw_data) ---
  const rawListings = allListings.filter((l) => l.raw_data)
  const photoCounts = rawListings.map((l) => {
    const rd = l.raw_data!
    const pics = (rd.visible_pictures as { pictures?: unknown[]; additional_pictures_count?: number } | undefined)
    const listed = (pics?.pictures as unknown[])?.length ?? 0
    const additional = pics?.additional_pictures_count ?? 0
    return listed + additional
  })
  const withGPS = allListings.filter((l) => {
    // Check if listing has lat/lng via raw_data geolocation
    const geo = (l.raw_data?.posting_location as { posting_geolocation?: { geolocation?: { latitude: number } } } | undefined)
    return geo?.posting_geolocation?.geolocation?.latitude != null
  }).length
  const premiumCount = rawListings.filter((l) => l.raw_data!.premier === true).length
  const ages = rawListings
    .map((l) => {
      const features = l.raw_data!.main_features as Record<string, { label: string; value: string }> | undefined
      if (!features) return null
      for (const feat of Object.values(features)) {
        if (feat.label?.toLowerCase().includes("antigüedad") || feat.label?.toLowerCase().includes("antiguedad")) {
          const n = parseFloat(feat.value)
          return isNaN(n) ? null : n
        }
      }
      return null
    })
    .filter((a): a is number => a !== null)

  const marketQualityData = {
    avgPhotos: photoCounts.length > 0 ? photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length : 0,
    pctWithGPS: allListings.length > 0 ? Math.round((withGPS / allListings.length) * 100) : 0,
    pctPremium: rawListings.length > 0 ? Math.round((premiumCount / rawListings.length) * 100) : 0,
    avgPropertyAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    totalListings: allListings.length,
  }

  return (
    <div className="space-y-8">
      {/* [A] Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          {badges.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={`px-3 py-1 ${b.color} text-[10px] font-bold rounded-full tracking-widest uppercase`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-4xl font-extrabold tracking-tight">
            {zone.zone_name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            Análisis estratégico del mercado inmobiliario · Tijuana
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton zoneSlug={slug} />
        </div>
      </div>

      {/* [A2] Zone Filters */}
      <Suspense fallback={<div className="h-10" />}>
        <ZoneFilters />
      </Suspense>

      {/* [B] KPI Ticker Strip */}
      <KPITickerStrip zone={zone} city={city} absorptionPct={absorptionPct} />

      {/* [B2] Low listings warning */}
      {zone.total_listings < 3 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <Icon name="info" className="text-amber-600 text-lg" />
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            Pocos datos disponibles. Las métricas pueden no ser representativas de la zona.
          </p>
        </div>
      )}

      {/* [B3] Zone Map — right after KPIs for immediate spatial context */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black tracking-tight">Mapa de la Zona</h3>
          <a href="/mapa" className="text-slate-800 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver mapa completo <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        <ZoneMapWrapper
          zones={allZones}
          focusZoneSlug={slug}
        />
      </section>

      {/* [C] Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column — Charts + Editorial */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <PriceDistributionChart data={priceDistData} />
          <PriceAreaScatter data={scatterData} availableTypes={scatterTypes} />
          <PropertyCompositionChart data={compositionData} />
          <PriceByTypeChart data={priceByTypeData} zoneName={zone.zone_name} />
          <PriceByBedroomsChart data={zoneAnalytics.priceByBedrooms} zoneName={zone.zone_name} />
          <EditorialCard
            zoneName={zone.zone_name}
            mainText={mainText}
            quote={quote}
          />
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* ADN de la Zona */}
          <ZoneDNACard
            dominantType={topTypeKey}
            dominantPct={topPct}
            avgTicket={zone.avg_ticket_by_type[topTypeKey] ?? zone.avg_ticket}
            avgArea={avgArea}
            avgBedrooms={avgBedrooms}
            avgBathrooms={avgBathrooms}
            avgPricePerM2={zone.avg_price_per_m2}
            totalListings={zone.total_listings}
          />

          {/* Casa vs Departamento */}
          <CasaVsDepto data={zoneAnalytics.casaVsDepto} zoneName={zone.zone_name} />

          {/* Venta vs Renta — only show when renta listings exist */}
          {ventaRentaData.rentaCount > 0 && (
            <VentaRentaComparison data={ventaRentaData} />
          )}

          {/* Zone vs City Comparison */}
          <ZoneComparisonEnhanced zone={zone} city={city} />

          {/* Market Quality */}
          <MarketQualityCard data={marketQualityData} />

          {/* Demographics — Radiografía Socioeconómica */}
          <DemographicsCard slug={slug} zone={zone} allZones={allZones} />

          {/* Cross-referenced Insights — INEGI × Market */}
          {(() => {
            const demo = getZoneDemographics(slug)
            const risk = riskMetrics.find((r) => r.zone_slug === slug) ?? null
            const insights = computeZoneInsights(demo, zone, risk, allZones)
            return insights ? <ZoneInsightsCard insights={insights} /> : null
          })()}

          {/* Risk Profile — Próximamente (requires 4+ weeks of data) */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-dashed border-slate-300 dark:border-slate-700">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">
              Perfil de Riesgo
            </h4>
            <p className="text-xs text-slate-400">
              Disponible cuando se acumulen 4+ semanas de datos históricos. Incluye: score de riesgo, volatilidad, cap rate y liquidez.
            </p>
          </div>
        </div>
      </div>

      {/* [E] Pipeline */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black tracking-tight">
            Proyectos en Pipeline
          </h3>
          <a href="/pipeline" className="text-slate-800 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver todos <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PIPELINE_PROJECTS.map((p) => (
            <PipelineCard key={p.name} project={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

// --- Text Generators ---

function generateMainText(
  zone: ZoneMetrics,
  cityAvg: number,
  topLabel: string,
  topCount: number
): string {
  const diffPct = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100

  if (diffPct > 10) {
    return `La ${zone.zone_name} se consolida como el epicentro del crecimiento vertical en la región fronteriza. Con una oferta dominada por ${topLabel}, el distrito está experimentando una transición hacia el uso mixto de alta densidad. Los precios se mantienen ${Math.abs(diffPct).toFixed(0)}% por encima del promedio de la ciudad, reflejando la alta demanda del segmento corporativo y residencial de lujo.`
  } else if (diffPct < -10) {
    return `La ${zone.zone_name} representa una de las zonas con mayor potencial de revalorización en Tijuana. Con precios ${Math.abs(diffPct).toFixed(0)}% por debajo del promedio de la ciudad y una oferta concentrada en ${topLabel}, la zona atrae inversionistas que buscan rendimientos superiores al promedio. La infraestructura en desarrollo y los proyectos de regeneración urbana podrían catalizar un cambio significativo en los próximos 24 meses.`
  }
  return `La ${zone.zone_name} mantiene un posicionamiento sólido dentro del mercado inmobiliario de Tijuana, con precios alineados al promedio general de la ciudad. La oferta se distribuye principalmente en ${topLabel}, indicando un mercado maduro con demanda estable. La zona ofrece un balance atractivo entre riesgo y rendimiento para inversionistas con perfil moderado.`
}

function generateQuote(zone: ZoneMetrics): string {
  if (zone.price_trend_pct > 4) {
    return `El corredor de ${zone.zone_name} ya no es solo para uso tradicional; la demanda está empujando los límites de precio hacia niveles históricos.`
  }
  if (zone.price_trend_pct < 0) {
    return `La corrección actual en ${zone.zone_name} no debe interpretarse como debilidad — es una consolidación natural que abre ventanas de oportunidad.`
  }
  return `${zone.zone_name} sigue siendo una apuesta segura para inversionistas que buscan estabilidad con crecimiento orgánico sostenido.`
}
