import { Suspense } from "react"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { DemoScroll } from "@/components/demo-scroll"
import { DemoVideo } from "@/components/demo-video"
import { Icon } from "@/components/icon"
import { ZoneCard } from "@/components/zone-card"
import { PriceChart } from "@/components/price-chart"
import { ZonesBarChart } from "@/components/zones-bar-chart"
import { KPIPrecio } from "@/components/kpi-precio"
import { KPIInventario } from "@/components/kpi-inventario"
import { KPIComposicion } from "@/components/kpi-plusvalia"
import { MiniMapWrapper } from "@/components/map/mini-map-wrapper"
import { NarrativeInsight } from "@/components/narrative-insight"
import { InventoryTypeChart } from "@/components/inventory-type-chart"
import { TopZonesHighlight } from "@/components/top-zones-highlight"
import { PriceTable } from "@/components/price-table"
import { PriceRangeChart } from "@/components/price-range-chart"
import { TypeCompositionChart } from "@/components/type-composition-chart"
import { OfferConcentrationChart } from "@/components/offer-concentration-chart"
import { MarketFilters } from "@/components/market-filters"
import { getZoneMetrics, getCityMetrics, getLastSnapshotDate } from "@/lib/data/zones"
import { UpdatedAt } from "@/components/updated-at"
import { getPriceTrendData } from "@/lib/data/snapshots"
import { getListingsAnalytics } from "@/lib/data/listings"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { formatCurrency } from "@/lib/utils"
import { getCityActivityLabel, describeActivity } from "@/lib/activity-labels"
import { getAllDemographics, getMarketIntelligenceInsights, computeOpportunityScore } from "@/lib/data/demographics"
import { MarketIntelligence } from "@/components/market-intelligence"
import { OpportunityIndexChart } from "@/components/opportunity-index-chart"
import { MarketDensityScatter } from "@/components/market-density-scatter"
import type { DensityBubble } from "@/components/market-density-scatter"
import { cookies } from "next/headers"
import Link from "next/link"
import type { PropertyType, ListingType } from "@/types/database"
import { COOKIE_CATEGORIA, COOKIE_OPERACION, parseCategoria, parseOperacion } from "@/lib/preference-cookies"

interface SearchParams {
  tipo?: string
  zona?: string
  operacion?: string
  categoria?: string
  precio_min?: string
  precio_max?: string
  area_min?: string
  area_max?: string
  rec?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  // Read persistent preferences from cookies (fallback: venta + residencial)
  const cookieStore = await cookies()
  const cookieOp = parseOperacion(cookieStore.get(COOKIE_OPERACION)?.value)
  const cookieCat = parseCategoria(cookieStore.get(COOKIE_CATEGORIA)?.value)

  // Sanitize and parse filter params
  const safeNum = (val?: string): number | undefined => {
    if (!val) return undefined
    const n = Number(val)
    return !isNaN(n) && n >= 0 ? n : undefined
  }

  const VALID_TYPES = new Set(["casa", "departamento", "terreno", "local", "oficina"])
  const VALID_OPS = new Set(["venta", "renta"])
  const VALID_CATS = new Set(["residencial", "comercial", "terreno"])

  const filters = {
    tipos: sp.tipo
      ? (sp.tipo.split(",").filter((t) => VALID_TYPES.has(t)) as PropertyType[])
      : undefined,
    zonas: sp.zona ? sp.zona.split(",") : undefined,
    listing_type: sp.operacion && VALID_OPS.has(sp.operacion)
      ? (sp.operacion as ListingType)
      : (sp.operacion === "todas" ? undefined : cookieOp as ListingType),
    categoria: sp.categoria && VALID_CATS.has(sp.categoria)
      ? (sp.categoria as "residencial" | "comercial" | "terreno")
      : (sp.categoria === "todas" ? undefined : cookieCat),
    precio_min: safeNum(sp.precio_min),
    precio_max: safeNum(sp.precio_max),
    area_min: safeNum(sp.area_min),
    area_max: safeNum(sp.area_max),
    recamaras: sp.rec
      ? sp.rec.split(",").map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 4)
      : undefined,
  }

  const [zones, ventaZonesForTable, rentaZonesForTable, inventoryZones, city, priceTrend, analytics, { data: riskData }, lastUpdated] = await Promise.all([
    getZoneMetrics(filters),
    getZoneMetrics({ ...filters, listing_type: "venta" }),
    getZoneMetrics({ ...filters, listing_type: "renta" }),
    getZoneMetrics({ listing_type: filters.listing_type }),
    getCityMetrics(filters),
    getPriceTrendData(),
    getListingsAnalytics(filters),
    getZoneRiskMetrics(),
    getLastSnapshotDate(),
  ])

  // Narrative helpers (guard empty zones from aggressive filtering)
  const publicZoneCount = zones.filter((z) => z.zone_slug !== "otros").length
  const topZone = zones.length > 0 ? zones.reduce((a, b) => a.avg_price_per_m2 > b.avg_price_per_m2 ? a : b) : null
  const mostActive = zones.length > 0 ? zones.reduce((a, b) => a.total_listings > b.total_listings ? a : b) : null
  const topByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
  const topByAffordable = [...zones].sort((a, b) => a.avg_price_per_m2 - b.avg_price_per_m2)
  const hasTrendHistory = priceTrend.length > 1

  return (
    <StaggerContainer className="space-y-10">
      <Suspense><DemoScroll /></Suspense>
      <DemoVideo
        pricePerM2={city.avg_price_per_m2}
        totalListings={analytics.totalListings}
        totalZones={publicZoneCount}
        topZones={topByPrice.slice(0, 8).map((z) => ({
          name: z.zone_name,
          pricePerM2: z.avg_price_per_m2,
          trend: z.price_trend_pct,
        }))}
      />
      {/* ─── 1. Header ─── */}
      <FadeInUp><div id="demo-header" className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-full tracking-widest uppercase">
                Panorama del Mercado
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
                Datos en Vivo
              </span>
              <UpdatedAt date={lastUpdated} />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-semibold rounded-full">
                {filters.listing_type === "renta" ? "Renta" : "Venta"} · {filters.categoria ? (filters.categoria.charAt(0).toUpperCase() + filters.categoria.slice(1)) : "Todas"}
              </span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Mercado Inmobiliario: Tijuana
            </h2>
            <p className="text-slate-500 max-w-xl font-medium">
              Panorama general del mercado inmobiliario de Tijuana, B.C.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <Suspense fallback={
              <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold shadow-sm">
                <Icon name="filter_list" className="text-sm" />
                Filtros
              </button>
            }>
              <MarketFilters defaultOperacion={filters.listing_type ?? ""} defaultCategoria={filters.categoria ?? ""} />
            </Suspense>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Icon name="ios_share" className="text-sm" />
              Exportar
            </button>
          </div>
        </div>
      </div></FadeInUp>

      {/* ─── 2. City KPIs ─── */}
      <FadeInUp><div id="demo-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPIPrecio
          pricePerM2={city.avg_price_per_m2}
          trendPct={city.price_trend_pct}
        />
        <KPIInventario
          medianPrice={analytics.medianPrice}
          avgPrice={analytics.avgPrice}
          listingType={filters.listing_type}
        />
        <KPIComposicion
          composition={analytics.compositionByType}
          totalListings={analytics.totalListings}
        />
      </div></FadeInUp>

      {/* ─── 2b. Mini Map ─── */}
      <FadeInUp><MiniMapWrapper zones={zones} /></FadeInUp>

      {/* ─── 3. PRICE TABLE — "Precio del Oro" ─── */}
      <FadeInUp><div id="demo-table"><PriceTable ventaZones={ventaZonesForTable} rentaZones={rentaZonesForTable} riskData={riskData} /></div></FadeInUp>

      {/* ─── 4. Resumen Ejecutivo ─── */}
      <FadeInUp><NarrativeInsight
        title="Resumen del mercado"
        body={topZone && mostActive
          ? `${topZone.zone_name} lidera en precio con ${formatCurrency(topZone.avg_price_per_m2)}/m², mientras que ${mostActive.zone_name} concentra la mayor actividad con ${describeActivity(mostActive.total_listings)}. El mercado de Tijuana monitorea ${publicZoneCount} zonas clave.`
          : `No se encontraron resultados con los filtros seleccionados. Intenta ajustar los filtros para ver datos del mercado.`
        }
        highlight={`${publicZoneCount} zonas monitoreadas · ${getCityActivityLabel(city.total_listings)}`}
      /></FadeInUp>

      {/* ─── 5. Análisis de Precios ─── */}
      <FadeInUp><section id="demo-charts">
        <div className="mb-4">
          <h3 className="text-xl font-black tracking-tight">Análisis de Precios</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Distribución y comparación de precios por zona</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ZonesBarChart data={analytics.pricePerM2ByZone} />
          <PriceRangeChart data={analytics.priceDistribution} />
        </div>
        {hasTrendHistory && <div className="mt-6"><PriceChart data={priceTrend} /></div>}
      </section></FadeInUp>

      {/* ─── 6. Composición del Mercado ─── */}
      <FadeInUp><section>
        <div className="mb-4">
          <h3 className="text-xl font-black tracking-tight">Composición del Mercado</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tipos de propiedad, inventario y concentración de oferta</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TypeCompositionChart data={analytics.compositionByType} totalListings={analytics.totalListings} />
          <OfferConcentrationChart data={analytics.offerConcentration} />
        </div>
        <div className="mt-6"><InventoryTypeChart zones={inventoryZones} /></div>
      </section></FadeInUp>

      {/* ─── 7. Zonas Destacadas ─── */}
      <FadeInUp><section id="demo-destacadas">
        <div className="mb-4">
          <h3 className="text-xl font-black tracking-tight">Zonas Destacadas</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Las zonas más caras y más accesibles de Tijuana</p>
        </div>
        <TopZonesHighlight topByPrice={topByPrice} topByAffordable={topByAffordable} />
      </section></FadeInUp>

      {/* ─── 6b. Inteligencia de Mercado (Censo × Inmobiliario) ─── */}
      {(() => {
        const allDemo = getAllDemographics().filter((d) => d.ageb_count > 0)
        if (allDemo.length === 0) return null

        // Focus on zones with significant market activity (>= 20 listings)
        const activeZones = zones.filter((z) => z.total_listings >= 20)
        const activeSlugs = new Set(activeZones.map((z) => z.zone_slug))
        const relevantDemo = allDemo.filter((d) => activeSlugs.has(d.zone_slug))

        const insights = getMarketIntelligenceInsights(relevantDemo, activeZones, riskData)

        // Opportunity data for chart
        const opportunityData = relevantDemo
          .map((demo) => {
            const zone = activeZones.find((z) => z.zone_slug === demo.zone_slug)
            if (!zone || zone.total_listings < 1) return null
            const opp = computeOpportunityScore(demo, zone, zones)
            return {
              zone_name: zone.zone_name,
              zone_slug: zone.zone_slug,
              ...opp,
            }
          })
          .filter(Boolean) as Array<{ zone_name: string; zone_slug: string; total: number; price_score: number; density_score: number; digital_score: number; economic_score: number }>

        // Density scatter data
        const densityData: DensityBubble[] = relevantDemo
          .map((demo) => {
            const zone = activeZones.find((z) => z.zone_slug === demo.zone_slug)
            if (!zone || zone.total_listings < 1 || demo.population < 100) return null
            const opp = computeOpportunityScore(demo, zone, zones)
            return {
              zone_name: zone.zone_name,
              zone_slug: zone.zone_slug,
              density: Math.round(demo.population / demo.ageb_count),
              price_m2: zone.avg_price_per_m2,
              inventory: zone.total_listings,
              opportunity: opp.total,
            }
          })
          .filter(Boolean) as DensityBubble[]

        return (
          <section className="space-y-6">
            <MarketIntelligence insights={insights} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpportunityIndexChart data={opportunityData} />
              <MarketDensityScatter data={densityData} />
            </div>
          </section>
        )
      })()}

      {/* ─── 7. Zones Grid + Map ─── */}
      <FadeInUp><section id="demo-zonas">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight">
              Zonas Monitoreadas
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {publicZoneCount} zonas · {getCityActivityLabel(city.total_listings)}
            </p>
          </div>
          <a href="/zonas" className="text-slate-800 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver todas <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        {(() => {
          const sorted = [...zones].filter((z) => z.zone_slug !== "otros").sort((a, b) => b.total_listings - a.total_listings)
          const maxListings = sorted[0]?.total_listings ?? 1

          // Build filter params for zone links (only include non-default values)
          const zfp = new URLSearchParams()
          if (filters.listing_type && filters.listing_type !== cookieOp) {
            zfp.set("operacion", filters.listing_type)
          }
          if (filters.categoria && filters.categoria !== cookieCat) {
            zfp.set("categoria", filters.categoria)
          }
          if (sp.operacion === "todas") zfp.set("operacion", "todas")
          if (sp.categoria === "todas") zfp.set("categoria", "todas")
          const zoneFilterStr = zfp.toString()

          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sorted.slice(0, 8).map((zone, i) => (
                  <ZoneCard key={zone.zone_id} zone={zone} rank={i + 1} maxListings={maxListings} filterParams={zoneFilterStr} />
                ))}
              </div>
              {sorted.length > 8 && (
                <div className="text-center mt-4">
                  <a href="/zonas" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Ver las {sorted.length} zonas <Icon name="arrow_forward" className="text-sm" />
                  </a>
                </div>
              )}
            </>
          )
        })()}
      </section></FadeInUp>

      {/* ─── 8. CTA de cierre ─── */}
      <FadeInUp><section className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-black mb-2">Explora el mercado</h3>
          <p className="text-slate-200 text-sm font-medium mb-6">
            Compara zonas, analiza riesgo, o busca propiedades específicas
            para tomar mejores decisiones de inversión.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/comparar"
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-800 rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Icon name="compare_arrows" className="text-sm" />
              Comparar Zonas
            </Link>
            <Link
              href="/riesgo"
              className="flex items-center gap-2 px-6 py-3 bg-white/15 text-white border border-white/30 rounded-full text-sm font-bold hover:bg-white/25 transition-all"
            >
              <Icon name="query_stats" className="text-sm" />
              Análisis de Riesgo
            </Link>
            <Link
              href="/buscar"
              className="flex items-center gap-2 px-6 py-3 bg-white/15 text-white border border-white/30 rounded-full text-sm font-bold hover:bg-white/25 transition-all"
            >
              <Icon name="search" className="text-sm" />
              Buscar Zonas
            </Link>
          </div>
        </div>
      </section></FadeInUp>
    </StaggerContainer>
  )
}
