import { notFound } from "next/navigation"
import { Icon } from "@/components/icon"
import { ExportButton } from "@/components/export-button"
import { HeatmapCard } from "@/components/heatmap-card"
import { EditorialCard } from "@/components/editorial-card"
import { KPIPrecio } from "@/components/kpi-precio"
import { KPIInventario } from "@/components/kpi-inventario"
import { KPIPlusvalia } from "@/components/kpi-plusvalia"
import { ComparisonTable } from "@/components/comparison-table"
import { PipelineCard, PIPELINE_PROJECTS } from "@/components/pipeline-card"
import { ZoneMapWrapper } from "@/components/map/zone-map-wrapper"
import { getZoneMetrics, getZoneBySlug, getCityMetrics } from "@/lib/data/zones"
import { getListings } from "@/lib/data/listings"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { PropertyType, ZoneMetrics, Listing } from "@/types/database"

const PROPERTY_LABELS: Record<PropertyType, string> = {
  casa: "Casas",
  departamento: "Departamentos",
  terreno: "Terrenos",
  local: "Locales",
  oficina: "Oficinas",
}

interface ZonePageProps {
  params: Promise<{ slug: string }>
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

export default async function ZonePage({ params }: ZonePageProps) {
  const { slug } = await params
  const [zone, city, allZones, { listings }] = await Promise.all([
    getZoneBySlug(slug),
    getCityMetrics(),
    getZoneMetrics(),
    getListings({ zonas: [slug] }),
  ])
  if (!zone) notFound()

  const cityAvg = city.avg_price_per_m2
  const diffFromCity = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100

  // Determine top property type
  const topType = Object.entries(zone.listings_by_type).sort(
    ([, a], [, b]) => b - a
  )[0]
  const topLabel = PROPERTY_LABELS[topType[0] as PropertyType].toLowerCase()

  // Generate editorial content based on zone data
  const mainText = generateMainText(zone, cityAvg, topLabel, topType[1])
  const quote = generateQuote(zone)

  // Compute comparison data
  const zonePriceUSD = Math.round(zone.avg_price_per_m2 / 17.5) // approximate MXN to USD
  const cityPriceUSD = Math.round(cityAvg / 17.5)
  const compRows = [
    {
      label: "Precio/m²",
      zona: `$${zonePriceUSD.toLocaleString()}`,
      ciudad: `$${cityPriceUSD.toLocaleString()}`,
    },
    {
      label: "Inventario",
      zona: `${zone.total_listings}`,
      ciudad: `${city.total_listings}`,
    },
    {
      label: "Tendencia",
      zona: formatPercent(zone.price_trend_pct),
      ciudad: formatPercent(city.price_trend_pct),
    },
  ]

  // Badges
  const badges: { label: string; color: string }[] = []
  if (zone.avg_price_per_m2 > cityAvg * 1.1) {
    badges.push({ label: "Premium District", color: "bg-blue-100 text-blue-700" })
  }
  if (zone.price_trend_pct > 4) {
    badges.push({ label: "High Demand", color: "bg-red-100 text-red-700" })
  }
  if (zone.price_trend_pct < 0) {
    badges.push({ label: "Price Correction", color: "bg-orange-100 text-orange-700" })
  }
  if (zone.total_listings > 200) {
    badges.push({ label: "High Volume", color: "bg-green-100 text-green-700" })
  }

  // Absorption rate (simulated from data)
  const absorptionPct = Math.min(
    95,
    Math.round(50 + zone.price_trend_pct * 5 + (zone.total_listings > 200 ? 10 : 0))
  )

  // Risk note
  const riskNote =
    zone.price_trend_pct > 4
      ? "Alta demanda está acelerando los precios por encima del promedio regional. Vigilar sostenibilidad."
      : zone.price_trend_pct < 0
        ? "Corrección de precios activa. Posible oportunidad para inversión a mediano plazo."
        : "Mercado estable con crecimiento moderado. Riesgo de inversión bajo-medio."

  return (
    <div className="space-y-10">
      {/* Page Header */}
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
            Análisis Estratégico: {zone.zone_name}
          </h2>
          <p className="text-slate-500 max-w-xl font-medium">
            Modelado predictivo y métricas de absorción para{" "}
            {zone.zone_name}, Tijuana.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Icon name="filter_list" className="text-sm" />
            Filtros Avanzados
          </button>
          <ExportButton zoneSlug={slug} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <HeatmapCard
            zoneName={zone.zone_name}
            pricePerM2={zone.avg_price_per_m2}
            trendPct={zone.price_trend_pct}
          />
          <EditorialCard
            zoneName={zone.zone_name}
            mainText={mainText}
            quote={quote}
          />
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <KPIPrecio
            pricePerM2={zone.avg_price_per_m2}
            trendPct={zone.price_trend_pct}
          />
          <KPIInventario
            totalListings={zone.total_listings}
            absorptionPct={absorptionPct}
          />
          <KPIPlusvalia trendPct={zone.price_trend_pct} riskNote={riskNote} />
          <ComparisonTable
            zoneName={zone.zone_name}
            rows={compRows}
          />
        </div>
      </div>

      {/* Zone Map */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black tracking-tight">Mapa de la Zona</h3>
          <a href="/mapa" className="text-blue-700 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver mapa completo <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        <ZoneMapWrapper
          zones={allZones}
          listings={listings as Listing[]}
          focusZoneSlug={slug}
        />
      </section>

      {/* Pipeline Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black tracking-tight">
            Proyectos en Pipeline
          </h3>
          <button className="text-blue-700 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver todos <Icon name="arrow_forward" className="text-sm" />
          </button>
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

function generateMainText(
  zone: ZoneMetrics,
  cityAvg: number,
  topLabel: string,
  topCount: number
): string {
  const diffPct = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100

  if (diffPct > 10) {
    return `La ${zone.zone_name} se consolida como el epicentro del crecimiento vertical en la región fronteriza. Con una oferta dominada por ${topLabel} (${topCount} de ${zone.total_listings} propiedades activas), el distrito está experimentando una transición hacia el uso mixto de alta densidad. Los precios se mantienen ${Math.abs(diffPct).toFixed(0)}% por encima del promedio de la ciudad, reflejando la alta demanda del segmento corporativo y residencial de lujo.`
  } else if (diffPct < -10) {
    return `La ${zone.zone_name} representa una de las zonas con mayor potencial de revalorización en Tijuana. Con precios ${Math.abs(diffPct).toFixed(0)}% por debajo del promedio de la ciudad y una oferta concentrada en ${topLabel} (${topCount} unidades), la zona atrae inversionistas que buscan rendimientos superiores al promedio. La infraestructura en desarrollo y los proyectos de regeneración urbana podrían catalizar un cambio significativo en los próximos 24 meses.`
  }
  return `La ${zone.zone_name} mantiene un posicionamiento sólido dentro del mercado inmobiliario de Tijuana, con precios alineados al promedio general de la ciudad. La oferta se distribuye principalmente en ${topLabel} (${topCount} de ${zone.total_listings} propiedades), indicando un mercado maduro con demanda estable. La zona ofrece un balance atractivo entre riesgo y rendimiento para inversionistas con perfil moderado.`
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
