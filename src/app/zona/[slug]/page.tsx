import { notFound } from "next/navigation"
import Link from "next/link"
import { MetricCard } from "@/components/metric-card"
import { InsightCard } from "@/components/insight-card"
import { PropertyTypeChart } from "@/components/property-type-chart"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { TIJUANA_ZONES, TIJUANA_CITY_METRICS } from "@/lib/mock-data"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils"
import {
  ArrowLeft,
  MapPin,
  Home,
  TrendingUp,
  DollarSign,
  Building,
} from "lucide-react"
import type { PropertyType } from "@/types/database"

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
  return TIJUANA_ZONES.map((zone) => ({ slug: zone.zone_slug }))
}

export async function generateMetadata({ params }: ZonePageProps) {
  const { slug } = await params
  const zone = TIJUANA_ZONES.find((z) => z.zone_slug === slug)
  if (!zone) return {}
  return {
    title: `${zone.zone_name} — Inmobiq`,
    description: `Análisis del mercado inmobiliario en ${zone.zone_name}, Tijuana. Precio promedio: ${formatCurrency(zone.avg_price_per_m2)}/m².`,
  }
}

export default async function ZonePage({ params }: ZonePageProps) {
  const { slug } = await params
  const zone = TIJUANA_ZONES.find((z) => z.zone_slug === slug)
  if (!zone) notFound()

  const cityAvg = TIJUANA_CITY_METRICS.avg_price_per_m2
  const diffFromCity = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100
  const insight = generateZoneInsight(zone, cityAvg)

  const propertyData = (
    Object.keys(PROPERTY_LABELS) as PropertyType[]
  )
    .filter((type) => zone.listings_by_type[type] > 0)
    .map((type) => ({
      type: PROPERTY_LABELS[type],
      count: zone.listings_by_type[type],
      ticket: zone.avg_ticket_by_type[type],
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Tijuana
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-primary">
          <MapPin className="h-3.5 w-3.5" />
          <span>Tijuana, Baja California</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {zone.zone_name}
        </h1>
        <p className="text-muted-foreground">
          Análisis detallado del mercado inmobiliario en {zone.zone_name}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Precio x m²"
          value={formatCurrency(zone.avg_price_per_m2)}
          trend={zone.price_trend_pct}
          subtitle="vs. mes anterior"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          title="Ticket promedio"
          value={formatCurrency(zone.avg_ticket)}
          subtitle="Todas las propiedades"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Propiedades activas"
          value={formatNumber(zone.total_listings)}
          subtitle="En 4 portales"
          icon={<Home className="h-5 w-5" />}
        />
        <MetricCard
          title="vs. promedio Tijuana"
          value={formatPercent(diffFromCity)}
          subtitle={
            diffFromCity > 0
              ? "Por encima del promedio"
              : "Por debajo del promedio"
          }
          icon={<Building className="h-5 w-5" />}
        />
      </div>

      {/* AI Insight */}
      <InsightCard title={`Análisis de ${zone.zone_name}`} content={insight} />

      {/* Property type breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por tipo de propiedad</CardTitle>
          <CardDescription>
            Distribución de propiedades activas en {zone.zone_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyTypeChart data={propertyData} />
        </CardContent>
      </Card>

      {/* CTA */}
      {zone.price_trend_pct > 3 && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-xl font-bold sm:text-2xl">
            {zone.zone_name} muestra alto crecimiento
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Si estás planeando un desarrollo en esta zona, gestiona tu
            comercialización con las herramientas de Narrativa360.
          </p>
          <a
            href="https://narrativa360.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Conoce Narrativa360 →
          </a>
        </section>
      )}
    </div>
  )
}

function generateZoneInsight(
  zone: (typeof TIJUANA_ZONES)[0],
  cityAvg: number
): string {
  const diffPct = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100
  const topType = Object.entries(zone.listings_by_type).sort(
    ([, a], [, b]) => b - a
  )[0]
  const topLabel =
    PROPERTY_LABELS[topType[0] as PropertyType].toLowerCase()

  const parts: string[] = []

  if (diffPct > 10) {
    parts.push(
      `${zone.zone_name} se posiciona como una de las zonas premium de Tijuana, con precios ${diffPct.toFixed(0)}% por encima del promedio de la ciudad.`
    )
  } else if (diffPct < -10) {
    parts.push(
      `${zone.zone_name} ofrece precios ${Math.abs(diffPct).toFixed(0)}% por debajo del promedio de Tijuana, representando una zona de entrada accesible para inversión.`
    )
  } else {
    parts.push(
      `${zone.zone_name} se encuentra en línea con el promedio general de Tijuana en términos de precio por metro cuadrado.`
    )
  }

  parts.push(
    `La oferta se concentra en ${topLabel} (${topType[1]} de ${zone.total_listings} propiedades activas).`
  )

  if (zone.price_trend_pct > 4) {
    parts.push(
      `Con un crecimiento del ${zone.price_trend_pct}%, muestra una tendencia alcista fuerte que sugiere alta demanda en la zona.`
    )
  } else if (zone.price_trend_pct < 0) {
    parts.push(
      `La tendencia a la baja del ${Math.abs(zone.price_trend_pct)}% podría representar una oportunidad de compra para inversionistas atentos.`
    )
  }

  return parts.join(" ")
}
