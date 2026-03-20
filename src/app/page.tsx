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
import { PriceTable } from "@/components/price-table"
import { PriceRangeChart } from "@/components/price-range-chart"
import { TypeCompositionChart } from "@/components/type-composition-chart"
import { OfferConcentrationChart } from "@/components/offer-concentration-chart"
import { MarketFilters } from "@/components/market-filters"
import { getZoneMetrics, getCityMetrics } from "@/lib/data/zones"
import { getPriceTrendData } from "@/lib/data/snapshots"
import { getListingsAnalytics } from "@/lib/data/listings"
import { getZoneRiskMetrics } from "@/lib/data/risk"
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

  // Sanitize and parse filter params
  const safeNum = (val?: string): number | undefined => {
    if (!val) return undefined
    const n = Number(val)
    return !isNaN(n) && n >= 0 ? n : undefined
  }

  const VALID_TYPES = new Set(["casa", "departamento", "terreno", "local", "oficina"])
  const VALID_OPS = new Set(["venta", "renta"])

  const filters = {
    tipos: sp.tipo
      ? (sp.tipo.split(",").filter((t) => VALID_TYPES.has(t)) as PropertyType[])
      : undefined,
    zonas: sp.zona ? sp.zona.split(",") : undefined,
    listing_type: sp.operacion && VALID_OPS.has(sp.operacion)
      ? (sp.operacion as ListingType)
      : undefined,
    precio_min: safeNum(sp.precio_min),
    precio_max: safeNum(sp.precio_max),
    area_min: safeNum(sp.area_min),
    area_max: safeNum(sp.area_max),
    recamaras: sp.rec
      ? sp.rec.split(",").map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 4)
      : undefined,
  }

  const [zones, city, priceTrend, analytics, riskData] = await Promise.all([
    getZoneMetrics(filters),
    getCityMetrics(filters),
    getPriceTrendData(),
    getListingsAnalytics(filters),
    getZoneRiskMetrics(),
  ])

  // Narrative helpers (guard empty zones from aggressive filtering)
  const topZone = zones.length > 0 ? zones.reduce((a, b) => a.avg_price_per_m2 > b.avg_price_per_m2 ? a : b) : null
  const mostActive = zones.length > 0 ? zones.reduce((a, b) => a.total_listings > b.total_listings ? a : b) : null
  const topByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
  const topByActivity = [...zones].sort((a, b) => b.total_listings - a.total_listings)
  const hasTrendHistory = priceTrend.length > 1

  return (
    <div className="space-y-10">
      {/* ─── 1. Header ─── */}
      <div className="relative">
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

      {/* ─── 3. PRICE TABLE — "Precio del Oro" ─── */}
      <PriceTable zones={zones} riskData={riskData} />

      {/* ─── 4. Resumen Ejecutivo ─── */}
      <NarrativeInsight
        title="Resumen del mercado"
        body={topZone && mostActive
          ? `${topZone.zone_name} lidera en precio con ${formatCurrency(topZone.avg_price_per_m2)}/m², mientras que ${mostActive.zone_name} concentra la mayor actividad con ${formatNumber(mostActive.total_listings)} propiedades activas. En total, el mercado de Tijuana suma ${formatNumber(city.total_listings)} propiedades en ${city.total_zones} zonas monitoreadas.`
          : `No se encontraron resultados con los filtros seleccionados. Intenta ajustar los filtros para ver datos del mercado.`
        }
        highlight={`${city.total_zones} zonas monitoreadas · ${formatNumber(city.total_listings)} propiedades activas`}
      />

      {/* ─── 5. Charts ─── */}
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

      {/* ─── 6. Zonas Destacadas ─── */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-black tracking-tight">Zonas Destacadas</h3>
          <p className="text-sm text-slate-500 font-medium">
            Las zonas más caras y con mayor volumen de actividad en Tijuana
          </p>
        </div>
        <TopZonesHighlight topByPrice={topByPrice} topByActivity={topByActivity} />
      </section>

      {/* ─── 7. Zones Grid + Map ─── */}
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
        <div className="mb-6">
          <MiniMapWrapper zones={zones} />
        </div>
        {(() => {
          const sorted = [...zones].sort((a, b) => b.total_listings - a.total_listings)
          const maxListings = sorted[0]?.total_listings ?? 1
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sorted.map((zone, i) => (
                <ZoneCard key={zone.zone_id} zone={zone} rank={i + 1} maxListings={maxListings} />
              ))}
            </div>
          )
        })()}
      </section>

      {/* ─── 8. CTA de cierre ─── */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-black mb-2">Explora el mercado</h3>
          <p className="text-blue-100 text-sm font-medium mb-6">
            Datos actualizados semanalmente. Compara zonas, analiza riesgo, o busca
            propiedades específicas para tomar mejores decisiones de inversión.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/comparar"
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
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
              Buscar Propiedades
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
