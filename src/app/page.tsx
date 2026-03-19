import { MetricCard } from "@/components/metric-card"
import { ZoneCard } from "@/components/zone-card"
import { PriceChart } from "@/components/price-chart"
import { ZonesBarChart } from "@/components/zones-bar-chart"
import { InsightCard } from "@/components/insight-card"
import { TIJUANA_CITY_METRICS, TIJUANA_ZONES } from "@/lib/mock-data"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { MapPin, Home, TrendingUp, BarChart3 } from "lucide-react"

export default function HomePage() {
  const city = TIJUANA_CITY_METRICS

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>Baja California, México</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Mercado Inmobiliario de Tijuana
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Panorama actual del mercado inmobiliario. Datos agregados de los
          principales portales para ayudarte a tomar mejores decisiones.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Precio promedio x m²"
          value={formatCurrency(city.avg_price_per_m2)}
          trend={city.price_trend_pct}
          subtitle="vs. mes anterior"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Propiedades activas"
          value={formatNumber(city.total_listings)}
          subtitle="En 4 portales"
          icon={<Home className="h-5 w-5" />}
        />
        <MetricCard
          title="Zonas monitoreadas"
          value={city.total_zones.toString()}
          subtitle="Tijuana, B.C."
          icon={<MapPin className="h-5 w-5" />}
        />
        <MetricCard
          title="Zona más cara"
          value="Playas de Tijuana"
          subtitle={`${formatCurrency(38200)} / m²`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* AI Insight */}
      <InsightCard
        title="Resumen del mercado"
        content="El mercado inmobiliario de Tijuana muestra un crecimiento sostenido del 3.1% en el precio por metro cuadrado. Las zonas costeras como Playas de Tijuana lideran con incrementos del 6.8%, impulsadas por la demanda de departamentos de inversionistas binacionales. Zonas como Residencial del Bosque (+5.3%) presentan oportunidades interesantes por su crecimiento acelerado con precios aún accesibles respecto al promedio de la ciudad."
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PriceChart />
        <ZonesBarChart />
      </div>

      {/* Zones */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Zonas y Colonias
          </h2>
          <p className="text-sm text-muted-foreground">
            Explora las principales zonas inmobiliarias de Tijuana
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TIJUANA_ZONES.map((zone) => (
            <ZoneCard key={zone.zone_id} zone={zone} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-8 text-center text-primary-foreground sm:p-12">
        <h2 className="text-2xl font-bold sm:text-3xl">
          ¿Ya tienes un proyecto inmobiliario?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Gestiona la comercialización de tu desarrollo con inteligencia
          artificial. Desde la captación del lead hasta el cierre de venta.
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
    </div>
  )
}
