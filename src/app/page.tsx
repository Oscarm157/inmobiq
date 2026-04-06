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
import { AuthGatedSection } from "@/components/auth-gated-section"
import { MarketDensityScatter } from "@/components/market-density-scatter"
import type { DensityBubble } from "@/components/market-density-scatter"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
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
      <FadeInUp><div id="demo-header">
        <PageHeader
          title="Mercado Inmobiliario: Tijuana"
          subtitle="Panorama general del mercado inmobiliario de Tijuana, B.C."
          badges={[
            { label: "Panorama del Mercado", variant: "neutral" },
            { label: "Datos en Vivo", variant: "green" },
          ]}
          meta={
            <>
              <UpdatedAt date={lastUpdated} />
              <span className="px-2.5 py-1 bg-badge-blue-bg text-badge-blue-text text-[10px] font-semibold rounded-full">
                {filters.listing_type === "renta" ? "Renta" : "Venta"} · {filters.categoria ? (filters.categoria.charAt(0).toUpperCase() + filters.categoria.slice(1)) : "Todas"}
              </span>
            </>
          }
          actions={
            <>
              <Suspense fallback={
                <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-full text-sm font-bold shadow-sm">
                  <Icon name="filter_list" className="text-sm" />
                  Filtros
                </button>
              }>
                <MarketFilters defaultOperacion={filters.listing_type ?? ""} defaultCategoria={filters.categoria ?? ""} />
              </Suspense>
              <button className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-sm font-bold shadow-lg shadow-foreground/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Icon name="ios_share" className="text-sm" />
                Exportar
              </button>
            </>
          }
        />
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

      {/* ─── Auth-gated sections: titles visible, content blurred for anon ─── */}

      {/* ─── 3. PRICE TABLE — "Precio del Oro" ─── */}
      <FadeInUp><AuthGatedSection>
        <div id="demo-table"><PriceTable ventaZones={ventaZonesForTable} rentaZones={rentaZonesForTable} riskData={riskData} /></div>
      </AuthGatedSection></FadeInUp>

      {/* ─── 4. Resumen Ejecutivo ─── */}
      <FadeInUp><AuthGatedSection>
        <NarrativeInsight
          title="Resumen del mercado"
          body={topZone && mostActive
            ? `${topZone.zone_name} lidera en precio con ${formatCurrency(topZone.avg_price_per_m2)}/m², mientras que ${mostActive.zone_name} concentra la mayor actividad con ${describeActivity(mostActive.total_listings)}. El mercado de Tijuana monitorea ${publicZoneCount} zonas clave.`
            : `No se encontraron resultados con los filtros seleccionados. Intenta ajustar los filtros para ver datos del mercado.`
          }
          highlight={`${publicZoneCount} zonas monitoreadas · ${getCityActivityLabel(city.total_listings)}`}
        />
      </AuthGatedSection></FadeInUp>

      {/* ─── 5. Análisis de Precios ─── */}
      <FadeInUp><section id="demo-charts">
        <AuthGatedSection title={
          <SectionHeading
            title="Análisis de Precios"
            subtitle="Distribución y comparación de precios por zona"
          />
        }>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            <ZonesBarChart data={analytics.pricePerM2ByZone} />
            <PriceRangeChart data={analytics.priceDistribution} />
          </div>
          {hasTrendHistory && <div className="mt-6"><PriceChart data={priceTrend} /></div>}
        </AuthGatedSection>
      </section></FadeInUp>

      {/* ─── 6. Composición del Mercado ─── */}
      <FadeInUp><section>
        <AuthGatedSection title={
          <SectionHeading
            title="Composición del Mercado"
            subtitle="Tipos de propiedad, inventario y concentración de oferta"
          />
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TypeCompositionChart data={analytics.compositionByType} totalListings={analytics.totalListings} />
            <OfferConcentrationChart data={analytics.offerConcentration} />
          </div>
          <div className="mt-6"><InventoryTypeChart zones={inventoryZones} /></div>
        </AuthGatedSection>
      </section></FadeInUp>

      {/* ─── 7. Zonas Destacadas ─── */}
      <FadeInUp><section id="demo-destacadas">
        <AuthGatedSection title={
          <SectionHeading
            title="Zonas Destacadas"
            subtitle="Las zonas más caras y más accesibles de Tijuana"
          />
        }>
          <TopZonesHighlight topByPrice={topByPrice} topByAffordable={topByAffordable} />
        </AuthGatedSection>
      </section></FadeInUp>

      {/* ─── 8. Inteligencia de Mercado (Censo × Inmobiliario) ─── */}
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
          <FadeInUp><section className="space-y-6">
            <AuthGatedSection title={
              <SectionHeading
                title="Inteligencia de Mercado"
                subtitle="Datos censales cruzados con métricas inmobiliarias"
              />
            }>
              <MarketIntelligence insights={insights} hideHeader />
            </AuthGatedSection>
            <AuthGatedSection title={
              <SectionHeading
                title="Índice de Oportunidad y Densidad"
                subtitle="Scoring multi-variable por zona y distribución geográfica"
              />
            }>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OpportunityIndexChart data={opportunityData} />
                <MarketDensityScatter data={densityData} />
              </div>
            </AuthGatedSection>
          </section></FadeInUp>
        )
      })()}

      {/* ─── 9. Zones Grid ─── */}
      <FadeInUp><section id="demo-zonas">
        <AuthGatedSection title={
          <SectionHeading
            title="Zonas Monitoreadas"
            subtitle={`${publicZoneCount} zonas · ${getCityActivityLabel(city.total_listings)}`}
            size="lg"
            action={
              <a href="/zonas" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Ver todas <Icon name="arrow_forward" className="text-sm" />
              </a>
            }
          />
        }>
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
                <div className="text-center mt-6">
                  <a href="/zonas" className="inline-flex items-center gap-1.5 px-6 py-3 bg-surface-muted text-foreground rounded-full text-sm font-bold hover:bg-surface-elevated transition-colors">
                    Ver las {sorted.length} zonas <Icon name="arrow_forward" className="text-sm" />
                  </a>
                </div>
              )}
            </>
          )
        })()}
        </AuthGatedSection>
      </section></FadeInUp>

      {/* ─── 10. CTA de cierre ─── */}
      <FadeInUp><section className="relative overflow-hidden rounded-2xl p-8 md:p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-blue-950/80 dark:via-slate-900 dark:to-slate-950">
        {/* Subtle mesh decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.07] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/[0.05] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/[0.04] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-2xl">
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
            Explora el mercado
          </h3>
          <p className="text-slate-300 text-sm md:text-base font-medium mb-8 leading-relaxed">
            Compara zonas, analiza riesgo, o busca propiedades específicas
            para tomar mejores decisiones de inversión.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/comparar"
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/10"
            >
              <Icon name="compare_arrows" className="text-sm" />
              Comparar Zonas
            </Link>
            <Link
              href="/riesgo"
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.08] text-white border border-white/[0.15] rounded-full text-sm font-bold hover:bg-white/[0.14] backdrop-blur-sm transition-all"
            >
              <Icon name="query_stats" className="text-sm" />
              Análisis de Riesgo
            </Link>
            <Link
              href="/buscar"
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.08] text-white border border-white/[0.15] rounded-full text-sm font-bold hover:bg-white/[0.14] backdrop-blur-sm transition-all"
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
