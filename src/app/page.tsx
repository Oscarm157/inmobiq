import { Suspense } from "react"
import { Icon } from "@/components/icon"
import { ZoneCard } from "@/components/zone-card"
import { PriceChart } from "@/components/price-chart"
import { ZonesBarChart } from "@/components/zones-bar-chart"
import { KPIPrecio } from "@/components/kpi-precio"
import { KPIInventario } from "@/components/kpi-inventario"
import { KPIPlusvalia } from "@/components/kpi-plusvalia"
import { MiniMapWrapper } from "@/components/map/mini-map-wrapper"
import { NarrativeInsight } from "@/components/narrative-insight"
import { InventoryTypeChart } from "@/components/inventory-type-chart"
import { TopZonesHighlight } from "@/components/top-zones-highlight"
import { PipelinePreviewCard } from "@/components/pipeline-preview-card"
import { PortfolioTeaser } from "@/components/portfolio-teaser"
import { PriceRangeChart } from "@/components/price-range-chart"
import { TypeCompositionChart } from "@/components/type-composition-chart"
import { OfferConcentrationChart } from "@/components/offer-concentration-chart"
import { MarketFilters } from "@/components/market-filters"
import { getZoneMetrics, getCityMetrics } from "@/lib/data/zones"
import { getPriceTrendData } from "@/lib/data/snapshots"
import { getPipelineProjects } from "@/lib/data/pipeline"
import { getPortfolioPresets } from "@/lib/data/portfolio"
import { getListingsAnalytics } from "@/lib/data/listings"
import { formatNumber, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import type { PropertyType, ListingType } from "@/types/database"

interface SearchParams {
  tipo?: string
  zona?: string
  operacion?: string
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

  const filters = {
    tipos: sp.tipo ? (sp.tipo.split(",") as PropertyType[]) : undefined,
    zonas: sp.zona ? sp.zona.split(",") : undefined,
    listing_type: (sp.operacion as ListingType) || undefined,
    precio_min: sp.precio_min ? Number(sp.precio_min) : undefined,
    precio_max: sp.precio_max ? Number(sp.precio_max) : undefined,
    area_min: sp.area_min ? Number(sp.area_min) : undefined,
    area_max: sp.area_max ? Number(sp.area_max) : undefined,
    recamaras: sp.rec ? sp.rec.split(",").map(Number) : undefined,
  }

  const [zones, city, priceTrend, pipeline, presets, analytics] = await Promise.all([
    getZoneMetrics(filters),
    getCityMetrics(filters),
    getPriceTrendData(),
    Promise.resolve(getPipelineProjects()),
    Promise.resolve(getPortfolioPresets()),
    getListingsAnalytics(filters),
  ])

  // Narrative helpers (guard empty zones from aggressive filtering)
  const topZone = zones.length > 0 ? zones.reduce((a, b) => a.avg_price_per_m2 > b.avg_price_per_m2 ? a : b) : null
  const mostActive = zones.length > 0 ? zones.reduce((a, b) => a.total_listings > b.total_listings ? a : b) : null
  const topByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
  const topByActivity = [...zones].sort((a, b) => b.total_listings - a.total_listings)
  const featuredProjects = pipeline.filter((p) => p.status === "construccion" || p.status === "preventa").slice(0, 3)
  const totalUnits = pipeline.reduce((s, p) => s + p.units_total, 0)
  const totalSold = pipeline.reduce((s, p) => s + p.units_sold, 0)
  const hasTrendHistory = priceTrend.length > 1

  return (
    <div className="space-y-10">
      {/* ─── 1. Header ─── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
                Market Overview
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
                Live Data
              </span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Mercado Inmobiliario: Tijuana
            </h2>
            <p className="text-slate-500 max-w-xl font-medium">
              Panorama general del mercado. Datos agregados de los principales
              portales inmobiliarios para Tijuana, B.C.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <Suspense fallback={
              <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold shadow-sm">
                <Icon name="filter_list" className="text-sm" />
                Filtros
              </button>
            }>
              <MarketFilters />
            </Suspense>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Icon name="ios_share" className="text-sm" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. City KPIs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPIPrecio
          pricePerM2={city.avg_price_per_m2}
          trendPct={city.price_trend_pct}
        />
        <KPIInventario
          totalListings={city.total_listings}
          absorptionPct={76}
        />
        <KPIPlusvalia
          trendPct={city.price_trend_pct}
          riskNote="La demanda sostenida de compradores binacionales presiona los precios al alza en zonas costeras y céntricas."
        />
      </div>

      {/* ─── 3. Resumen Ejecutivo ─── */}
      <NarrativeInsight
        title="Resumen del mercado"
        body={topZone && mostActive
          ? `${topZone.zone_name} lidera en precio con ${formatCurrency(topZone.avg_price_per_m2)}/m², mientras que ${mostActive.zone_name} concentra la mayor actividad con ${formatNumber(mostActive.total_listings)} propiedades activas. En total, el mercado de Tijuana suma ${formatNumber(city.total_listings)} propiedades en ${city.total_zones} zonas monitoreadas.`
          : `No se encontraron resultados con los filtros seleccionados. Intenta ajustar los filtros para ver datos del mercado.`
        }
        highlight={`${city.total_zones} zonas monitoreadas · ${formatNumber(city.total_listings)} propiedades activas`}
      />

      {/* ─── 4. Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZonesBarChart data={analytics.pricePerM2ByZone} />
        <PriceRangeChart data={analytics.priceDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypeCompositionChart data={analytics.compositionByType} totalListings={analytics.totalListings} />
        <OfferConcentrationChart data={analytics.offerConcentration} />
      </div>

      {hasTrendHistory && <PriceChart data={priceTrend} />}
      <InventoryTypeChart zones={zones} />

      {/* ─── 5. Zonas Destacadas ─── */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-black tracking-tight">Zonas Destacadas</h3>
          <p className="text-sm text-slate-500 font-medium">
            Las zonas más caras y con mayor volumen de actividad en Tijuana
          </p>
        </div>
        <TopZonesHighlight topByPrice={topByPrice} topByActivity={topByActivity} />
      </section>

      {/* ─── 6. Risk / Volatility / Yield — Próximamente ─── */}
      <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <Icon name="security" className="text-xl text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Análisis de Riesgo, Volatilidad y Rendimiento</h3>
            <p className="text-sm text-slate-400">Disponible cuando se acumulen 4+ semanas de datos históricos</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Incluye: matriz de riesgo por zona, volatilidad de precios, cap rate estimado y perfil de liquidez.
        </p>
      </section>

      {/* ─── 8. Pipeline Preview ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black tracking-tight">Desarrollos en Curso</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full uppercase">Datos ilustrativos</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {pipeline.length} proyectos · {formatNumber(totalUnits)} unidades · {Math.round(totalSold / totalUnits * 100)}% vendido
            </p>
          </div>
          <Link href="/pipeline" className="text-blue-700 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver pipeline <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>

        <NarrativeInsight
          title="Pipeline de desarrollo"
          icon="construction"
          body={`El pipeline activo suma ${formatNumber(totalUnits)} unidades en ${pipeline.length} proyectos. ${featuredProjects[0]?.name ?? "El proyecto principal"} lidera con un ${Math.round((featuredProjects[0]?.units_sold ?? 0) / (featuredProjects[0]?.units_total ?? 1) * 100)}% de absorción. Los precios de preventa van desde ${featuredProjects[featuredProjects.length - 1]?.price_range ?? "N/A"} hasta ${featuredProjects[0]?.price_range ?? "N/A"}.`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {featuredProjects.map((project) => (
            <PipelinePreviewCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* ─── 9. Portfolio Teaser ─── */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-black tracking-tight">Estrategias de Inversión</h3>
          <p className="text-sm text-slate-500 font-medium">
            Tres portafolios predefinidos para diferentes perfiles de riesgo
          </p>
        </div>

        <PortfolioTeaser presets={presets} />
      </section>

      {/* ─── 10. Zones Grid ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight">
              Zonas Monitoreadas
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {formatNumber(city.total_zones)} zonas · {formatNumber(city.total_listings)} propiedades activas
            </p>
          </div>
          <a href="/mapa" className="text-blue-700 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver mapa <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <MiniMapWrapper zones={zones} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 content-start">
            {zones.slice(0, 3).map((zone) => (
              <ZoneCard key={`top-${zone.zone_id}`} zone={zone} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.zone_id} zone={zone} />
          ))}
        </div>
      </section>

      {/* ─── 11. CTA de cierre ─── */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-black mb-2">Mantente informado</h3>
          <p className="text-blue-100 text-sm font-medium mb-6">
            Datos actualizados semanalmente. Configura alertas personalizadas para recibir notificaciones
            cuando los precios cambien en tus zonas de interés, o compara zonas para tomar mejores decisiones.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/alertas"
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Icon name="notifications" className="text-sm" />
              Configurar Alertas
            </Link>
            <Link
              href="/comparar"
              className="flex items-center gap-2 px-6 py-3 bg-white/15 text-white border border-white/30 rounded-full text-sm font-bold hover:bg-white/25 transition-all"
            >
              <Icon name="compare_arrows" className="text-sm" />
              Comparar Zonas
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
