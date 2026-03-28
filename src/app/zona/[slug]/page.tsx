import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { DemoScroll } from "@/components/demo-scroll"
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
import { BedroomDistributionChart } from "@/components/zone/price-by-bedrooms-chart"
import { AreaByTypeChart, type AreaByTypeData } from "@/components/zone/area-by-type-chart"
import { TypeComparison } from "@/components/zone/type-comparison"
import { getZoneMetrics, getZoneBySlug, getCityMetrics, getLastSnapshotDate } from "@/lib/data/zones"
import { UpdatedAt } from "@/components/updated-at"
import { Breadcrumb } from "@/components/breadcrumb"
import { getListings, getZoneListingsAnalytics } from "@/lib/data/listings"
import type { ListingFilters } from "@/lib/data/listings"
import { formatCurrency } from "@/lib/utils"
import { filterNormalizedListings, removeOutliers } from "@/lib/data/normalize"
import { DEV_DRILLDOWN } from "@/lib/dev-flags"
import type { DrillDownListing } from "@/components/zone/drill-down-panel"
import type { PropertyType, ListingType, ZoneMetrics, Listing } from "@/types/database"
import type { PropertyCategory } from "@/lib/data/normalize"
import { cookies } from "next/headers"
import { COOKIE_CATEGORIA, COOKIE_OPERACION, parseCategoria, parseOperacion } from "@/lib/preference-cookies"

// Force dynamic rendering — page reads cookies() for user preferences
export const dynamic = "force-dynamic"

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
  return zones.filter((z) => z.zone_slug !== "otros").map((zone) => ({ slug: zone.zone_slug }))
}

export async function generateMetadata({ params }: ZonePageProps) {
  const { slug } = await params
  const zone = await getZoneBySlug(slug)
  if (!zone) return {}
  const title = `${zone.zone_name} — Análisis Inmobiliario`
  const description = `Análisis estratégico del mercado inmobiliario en ${zone.zone_name}, Tijuana. Precio promedio: ${formatCurrency(zone.avg_price_per_m2)}/m².`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://inmobiq.com/zona/${slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  }
}

export default async function ZonePage({ params, searchParams }: ZonePageProps) {
  const { slug } = await params
  if (slug === "otros") redirect("/")
  const sp = await searchParams

  // Read persistent preferences from cookies (fallback: venta + residencial)
  const cookieStore = await cookies()
  const cookieOp = parseOperacion(cookieStore.get(COOKIE_OPERACION)?.value)
  const cookieCat = parseCategoria(cookieStore.get(COOKIE_CATEGORIA)?.value)

  // Parse filters — URL params override cookie, cookie overrides hardcoded defaults
  const VALID_OPS = new Set(["venta", "renta", "todas"])
  const VALID_CATS = new Set(["residencial", "comercial", "terreno", "todas"])

  const rawOp = sp.operacion && VALID_OPS.has(sp.operacion) ? sp.operacion : cookieOp
  const rawCat = sp.categoria && VALID_CATS.has(sp.categoria) ? sp.categoria : cookieCat

  const filters: ListingFilters = {
    zonas: [slug],
    listing_type: rawOp !== "todas" ? (rawOp as ListingType) : undefined,
    categoria: rawCat !== "todas" ? (rawCat as PropertyCategory) : undefined,
  }

  const [zone, city, allZones, allZonesFiltered, { listings }, zoneAnalytics, riskMetrics, lastUpdated] = await Promise.all([
    getZoneBySlug(slug, filters),
    getCityMetrics(filters),
    getZoneMetrics(),
    getZoneMetrics(filters),
    getListings(filters),
    getZoneListingsAnalytics(slug, filters),
    getZoneRiskMetrics().then(r => r.data),
    getLastSnapshotDate(),
  ])
  if (!zone) notFound()

  // Normalize: filter out invalid pricing
  const normalizedListings = filterNormalizedListings(listings as Listing[])

  const cityAvg = city.avg_price_per_m2 || 1 // guard against division by zero

  // Determine top property type — use listing-level counts from typeComparison
  // (same source as TypeComparison component) for consistency, falling back to snapshots
  const tcSorted = [...zoneAnalytics.typeComparison]
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
  const tcTotal = tcSorted.reduce((sum, t) => sum + t.count, 0)

  let topTypeKey: PropertyType
  let topPct: number
  let topLabel: string

  if (tcSorted.length > 0 && tcTotal > 0) {
    topTypeKey = tcSorted[0].type as PropertyType
    topPct = Math.round((tcSorted[0].count / tcTotal) * 100)
    topLabel = PROPERTY_LABELS[topTypeKey].toLowerCase()
  } else {
    // Fallback to snapshot data (terrenos or no typeComparison data)
    const sortedTypes = Object.entries(zone.listings_by_type)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
    const topType = sortedTypes[0] ?? ["casa", 0]
    topTypeKey = topType[0] as PropertyType
    topLabel = PROPERTY_LABELS[topTypeKey].toLowerCase()
    topPct = zone.total_listings > 0
      ? Math.round((topType[1] / zone.total_listings) * 100)
      : 0
  }

  // Absorption rate
  const absorptionPct = Math.min(
    95,
    Math.round(50 + zone.price_trend_pct * 5 + (zone.total_listings > 200 ? 10 : 0))
  )

  // Generate editorial content
  const topCount = tcSorted.length > 0 ? tcSorted[0].count : (Object.values(zone.listings_by_type)[0] ?? 0)
  const mainText = generateMainText(zone, cityAvg, topLabel, topCount)
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

  // --- Area by type chart data ---
  const areaByTypeData: AreaByTypeData[] = zoneAnalytics.typeComparison
    .filter((t) => t.count > 0 && t.median_area > 0)
    .map((t) => ({
      type: PROPERTY_LABELS[t.type as PropertyType] ?? t.type,
      typeKey: t.type,
      area: t.median_area,
      label: `${t.median_area.toLocaleString("es-MX")} m²`,
    }))
    .sort((a, b) => b.area - a.area)

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
  // validListings = price-validated, chartListings = also IQR-cleaned for graphs
  const validListings = normalizedListings
  const chartListings = removeOutliers(validListings, (l) => l.price)

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

  // Dev drill-down: build listings-by-range map (only when feature flag is on)
  const toDevListing = (l: Listing): DrillDownListing => ({
    id: l.id, title: l.title, property_type: l.property_type, listing_type: l.listing_type,
    price: l.price, area_m2: l.area_m2, price_per_m2: l.price_per_m2,
    bedrooms: l.bedrooms, bathrooms: l.bathrooms, source: l.source, source_url: l.source_url,
  })
  const listingsByRange = DEV_DRILLDOWN
    ? Object.fromEntries(priceRanges.map((r) => [
        r.range,
        chartListings.filter((l) => l.price >= r.min && l.price < r.max).map(toDevListing),
      ]))
    : undefined

  // --- Scatter data (m² vs price, outlier-cleaned) ---
  const scatterData = chartListings
    .filter((l) => l.area_m2 > 0 && l.price > 0)
    .map((l) => ({
      area: Math.round(l.area_m2),
      price: Math.round(l.price),
      type: l.property_type,
      title: l.title,
      // Dev drill-down: include listing details when flag is on
      ...(DEV_DRILLDOWN ? {
        id: l.id, listing_type: l.listing_type, price_per_m2: l.price_per_m2,
        bedrooms: l.bedrooms, bathrooms: l.bathrooms, source: l.source, source_url: l.source_url,
      } : {}),
    }))
  const scatterTypes = [...new Set(scatterData.map((d) => d.type))]

  // --- Venta vs Renta data ---
  const ventaListings = validListings.filter((l) => l.listing_type === "venta")
  const rentaListings = validListings.filter((l) => l.listing_type === "renta")
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
  const rawListings = validListings.filter((l) => l.raw_data)
  const photoCounts = rawListings.map((l) => {
    const rd = l.raw_data!
    const pics = (rd.visible_pictures as { pictures?: unknown[]; additional_pictures_count?: number } | undefined)
    const listed = (pics?.pictures as unknown[])?.length ?? 0
    const additional = pics?.additional_pictures_count ?? 0
    return listed + additional
  })
  const withGPS = validListings.filter((l) => {
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
    pctWithGPS: validListings.length > 0 ? Math.round((withGPS / validListings.length) * 100) : 0,
    pctPremium: rawListings.length > 0 ? Math.round((premiumCount / rawListings.length) * 100) : 0,
    avgPropertyAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    totalListings: validListings.length,
  }

  return (
    <div className="space-y-8">
      <Suspense><DemoScroll /></Suspense>
      <Breadcrumb items={[{ label: "Zonas", href: "/zonas" }, { label: zone.zone_name }]} />
      {/* [A] Page Header */}
      <div id="demo-header" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
          <div className="flex items-center gap-3">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Análisis estratégico del mercado inmobiliario · Tijuana
            </p>
            <UpdatedAt date={lastUpdated} />
          </div>
        </div>
        <div className="flex gap-3">
          <ExportButton zoneSlug={slug} />
        </div>
      </div>

      {/* [A2] Zone Filters */}
      <Suspense fallback={<div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}>
        <ZoneFilters defaultOperacion={rawOp === "todas" ? "" : rawOp} defaultCategoria={rawCat === "todas" ? "" : rawCat} />
      </Suspense>

      {/* [B] KPI Ticker Strip */}
      <div id="demo-kpis"><KPITickerStrip zone={zone} city={city} absorptionPct={absorptionPct} /></div>

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
      <section id="demo-map">
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
        {/* Left Column — Editorial + Charts */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div id="demo-editorial"><EditorialCard
            zoneName={zone.zone_name}
            mainText={mainText}
            quote={quote}
          /></div>
          <div id="demo-charts"><PriceDistributionChart data={priceDistData} listingsByRange={listingsByRange} zoneSlug={slug} /></div>
          <PriceAreaScatter data={scatterData} availableTypes={scatterTypes} devMode={DEV_DRILLDOWN} zoneSlug={slug} />
          <PropertyCompositionChart data={compositionData} />
          {rawCat !== "terreno" && (
            <PriceByTypeChart data={priceByTypeData} zoneName={zone.zone_name} />
          )}
          {areaByTypeData.length > 0 && (
            <AreaByTypeChart data={areaByTypeData} zoneName={zone.zone_name} />
          )}
          {zoneAnalytics.priceByBedrooms && rawCat !== "comercial" && rawCat !== "terreno" && (
            <BedroomDistributionChart data={zoneAnalytics.priceByBedrooms} zoneName={zone.zone_name} />
          )}
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
            categoria={rawCat as PropertyCategory}
          />

          {/* Type comparison: Casa vs Depto (residencial) / Local vs Oficina (comercial) */}
          {rawCat !== "terreno" && (
            <TypeComparison data={zoneAnalytics.typeComparison} zoneName={zone.zone_name} categoria={rawCat} />
          )}

          {/* Venta vs Renta — only show when renta listings exist */}
          {ventaRentaData.rentaCount > 0 && (
            <VentaRentaComparison data={ventaRentaData} />
          )}

          {/* Zone vs City Comparison */}
          <ZoneComparisonEnhanced zone={zone} city={city} />

          {/* Market Quality — hidden for now */}
          {/* <MarketQualityCard data={marketQualityData} /> */}

          {/* Demographics — Radiografía Socioeconómica */}
          <DemographicsCard slug={slug} zone={zone} allZones={allZones} />

          {/* Cross-referenced Insights — INEGI × Market */}
          {(() => {
            const demo = getZoneDemographics(slug)
            const risk = riskMetrics.find((r) => r.zone_slug === slug) ?? null
            const insights = computeZoneInsights(demo, zone, risk, allZonesFiltered)
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
  const trendDir = zone.price_trend_pct > 0 ? "al alza" : zone.price_trend_pct < 0 ? "a la baja" : "estables"

  if (diffPct > 10) {
    return `${zone.zone_name} se posiciona como una de las zonas premium de Tijuana, con precios ${Math.abs(diffPct).toFixed(0)}% por encima del promedio de la ciudad y tendencia ${trendDir}. La oferta se concentra en ${topLabel}, reflejando un mercado de alta demanda tanto en compra-venta como en renta. En comparación con otras zonas, aquí el metro cuadrado tiene un precio consolidado que marca referencia para la ciudad.`
  } else if (diffPct < -10) {
    return `${zone.zone_name} opera con precios ${Math.abs(diffPct).toFixed(0)}% por debajo del promedio de Tijuana, con tendencia ${trendDir}. Su oferta está concentrada en ${topLabel}, con un mercado activo que presenta buenas opciones tanto para compra como para renta. Comparada con zonas de mayor precio, ofrece accesibilidad sin sacrificar conectividad ni servicios básicos de la ciudad.`
  }
  return `${zone.zone_name} mantiene precios alineados al promedio general de Tijuana con tendencia ${trendDir}. La oferta se distribuye principalmente en ${topLabel}, indicando un mercado maduro con demanda estable en ambas operaciones — compra-venta y renta. Frente a otras zonas, se posiciona como una opción equilibrada en precio y actividad.`
}

function generateQuote(zone: ZoneMetrics): string {
  if (zone.price_trend_pct > 4) {
    return `Los precios en ${zone.zone_name} muestran presión al alza sostenida — la demanda activa está superando la oferta disponible en la zona.`
  }
  if (zone.price_trend_pct < 0) {
    return `${zone.zone_name} atraviesa una fase de ajuste en precios — los valores se están recalibrando respecto a semanas anteriores.`
  }
  return `${zone.zone_name} muestra estabilidad en sus precios, con movimiento orgánico consistente con el ritmo general del mercado.`
}
