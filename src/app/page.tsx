import { MetricCard } from "@/components/metric-card";
import { ZoneCard } from "@/components/zone-card";
import { PriceChart } from "@/components/price-chart";
import { InsightCard } from "@/components/insight-card";
import { TIJUANA_CITY_METRICS, TIJUANA_ZONES } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { MapPin, Home, TrendingUp, BarChart3 } from "lucide-react";

export default function HomePage() {
  const city = TIJUANA_CITY_METRICS;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span>Baja California, México</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Mercado Inmobiliario de Tijuana
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)] max-w-2xl">
          Panorama actual del mercado inmobiliario. Datos agregados de los principales portales
          para ayudarte a tomar mejores decisiones.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Price Trend Chart */}
      <PriceChart />

      {/* Zones Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Zonas y Colonias</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Explora las principales zonas inmobiliarias de Tijuana
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TIJUANA_ZONES.map((zone) => (
            <ZoneCard key={zone.zone_id} zone={zone} />
          ))}
        </div>
      </section>

      {/* CTA to Narrativa360 */}
      <section className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">
          ¿Ya tienes un proyecto inmobiliario?
        </h2>
        <p className="text-white/80 max-w-xl mx-auto mb-6">
          Gestiona la comercialización de tu desarrollo con inteligencia artificial.
          Desde la captación del lead hasta el cierre de venta.
        </p>
        <a
          href="https://narrativa360.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white text-[var(--primary)] px-6 py-3 font-semibold hover:bg-white/90 transition-colors"
        >
          Conoce Narrativa360 →
        </a>
      </section>
    </div>
  );
}
