import { Icon } from "@/components/icon"
import { ZoneCard } from "@/components/zone-card"
import { PriceChart } from "@/components/price-chart"
import { ZonesBarChart } from "@/components/zones-bar-chart"
import { KPIPrecio } from "@/components/kpi-precio"
import { KPIInventario } from "@/components/kpi-inventario"
import { KPIPlusvalia } from "@/components/kpi-plusvalia"
import { MiniMapWrapper } from "@/components/map/mini-map-wrapper"
import { getZoneMetrics, getCityMetrics } from "@/lib/data/zones"
import { getPriceTrendData } from "@/lib/data/snapshots"
import { formatNumber } from "@/lib/utils"

export default async function HomePage() {
  const [zones, city, priceTrend] = await Promise.all([
    getZoneMetrics(),
    getCityMetrics(),
    getPriceTrendData(),
  ])

  return (
    <div className="space-y-10">
      {/* Page Header */}
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
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Icon name="filter_list" className="text-sm" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Icon name="ios_share" className="text-sm" />
            Exportar
          </button>
        </div>
      </div>

      {/* City KPIs */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceChart data={priceTrend} />
        <ZonesBarChart zones={zones} />
      </div>

      {/* Zones Grid */}
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
            <a href="/mapa" className="text-blue-700 text-sm font-bold flex items-center gap-1 hover:underline">
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
    </div>
  )
}
