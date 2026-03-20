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
import { RiskSummaryKPIs } from "@/components/risk-summary-kpis"
import { RiskMatrix } from "@/components/risk-matrix"
import { VolatilityChart } from "@/components/volatility-chart"
import { PipelinePreviewCard } from "@/components/pipeline-preview-card"
import { YieldChart } from "@/components/yield-chart"
import { PortfolioTeaser } from "@/components/portfolio-teaser"
import { PriceRangeChart } from "@/components/price-range-chart"
import { TypeCompositionChart } from "@/components/type-composition-chart"
import { OfferConcentrationChart } from "@/components/offer-concentration-chart"
import { getZoneMetrics, getCityMetrics } from "@/lib/data/zones"
import { getPriceTrendData } from "@/lib/data/snapshots"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getPipelineProjects } from "@/lib/data/pipeline"
import { getPortfolioPresets } from "@/lib/data/portfolio"
import { getListingsAnalytics } from "@/lib/data/listings"
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils"
import Link from "next/link"

export default async function HomePage() {
  const [zones, city, priceTrend, riskData, pipeline, presets, analytics] = await Promise.all([
    getZoneMetrics(),
    getCityMetrics(),
    getPriceTrendData(),
    getZoneRiskMetrics(),
    Promise.resolve(getPipelineProjects()),
    Promise.resolve(getPortfolioPresets()),
    getListingsAnalytics(),
  ])

  // Narrative helpers
  const topZone = zones.reduce((a, b) => a.avg_price_per_m2 > b.avg_price_per_m2 ? a : b)
  const fastestGrowing = zones.reduce((a, b) => a.price_trend_pct > b.price_trend_pct ? a : b)
  const mostActive = zones.reduce((a, b) => a.total_listings > b.total_listings ? a : b)
  const lowestRisk = [...riskData].sort((a, b) => a.risk_score - b.risk_score)[0]
  const highestYield = [...riskData].sort((a, b) => b.cap_rate - a.cap_rate)[0]
  const topByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
  const topByActivity = [...zones].sort((a, b) => b.total_listings - a.total_listings)
  const featuredProjects = pipeline.filter((p) => p.status === "construccion" || p.status === "preventa").slice(0, 3)
  const totalUnits = pipeline.reduce((s, p) => s + p.units_total, 0)
  const totalSold = pipeline.reduce((s, p) => s + p.units_sold, 0)

  return (
    <div className="space-y-10">
      {/* ─── 1. Header ─── */}
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
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Icon name="filter_list" className="text-sm" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Icon name="ios_share" className="text-sm" />
            Exportar
          </button>
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
        body={`${topZone.zone_name} lidera el mercado con ${formatCurrency(topZone.avg_price_per_m2)}/m², ${formatPercent(topZone.price_trend_pct)} respecto al periodo anterior. ${fastestGrowing.zone_name} registra el mayor crecimiento con ${formatPercent(fastestGrowing.price_trend_pct)}, mientras que ${mostActive.zone_name} concentra la mayor actividad con ${formatNumber(mostActive.total_listings)} propiedades activas. En total, el mercado de Tijuana suma ${formatNumber(city.total_listings)} propiedades en ${city.total_zones} zonas monitoreadas.`}
        highlight={`Tendencia general: ${city.price_trend_pct > 0 ? "mercado al alza" : "mercado estable"} con ${formatPercent(city.price_trend_pct)} de variación promedio`}
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

      <PriceChart data={priceTrend} />
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

      {/* ─── 6. Risk Overview ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Análisis de Riesgo</h3>
            <p className="text-sm text-slate-500 font-medium">
              Indicadores clave de riesgo y retorno por zona
            </p>
          </div>
          <Link href="/riesgo" className="text-blue-700 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver completo <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>

        <RiskSummaryKPIs riskData={riskData} />

        <div className="mt-6">
          <NarrativeInsight
            title="Perspectiva de riesgo"
            icon="security"
            body={`${lowestRisk.zone_name} presenta el perfil de menor riesgo con un score de ${lowestRisk.risk_score}/100 y una volatilidad de ${lowestRisk.volatility}%. ${highestYield.zone_name} ofrece el mejor rendimiento estimado con un cap rate de ${highestYield.cap_rate}% anual. La madurez del mercado varía desde zonas emergentes hasta consolidadas, ofreciendo opciones para diferentes perfiles de inversión.`}
          />
        </div>

        <div className="mt-6">
          <RiskMatrix riskData={riskData} zones={zones} />
        </div>
      </section>

      {/* ─── 7. Volatilidad + Yield ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolatilityChart riskData={riskData} />
        <YieldChart riskData={riskData} zones={zones} />
      </div>

      {/* ─── 8. Pipeline Preview ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Desarrollos en Curso</h3>
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

      {/* ─── 10. Zones Grid (existing) ─── */}
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
              <ZoneCard key={zone.zone_id} zone={zone} />
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
