import { notFound } from "next/navigation";
import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { InsightCard } from "@/components/insight-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIJUANA_ZONES, TIJUANA_CITY_METRICS } from "@/lib/mock-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ArrowLeft, MapPin, Home, TrendingUp, DollarSign, Building } from "lucide-react";
import type { PropertyType } from "@/types/database";

const PROPERTY_LABELS: Record<PropertyType, string> = {
  casa: "Casas",
  departamento: "Departamentos",
  terreno: "Terrenos",
  local: "Locales",
  oficina: "Oficinas",
};

interface ZonePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TIJUANA_ZONES.map((zone) => ({ slug: zone.zone_slug }));
}

export async function generateMetadata({ params }: ZonePageProps) {
  const { slug } = await params;
  const zone = TIJUANA_ZONES.find((z) => z.zone_slug === slug);
  if (!zone) return {};
  return {
    title: `${zone.zone_name} — Inmobiq`,
    description: `Análisis del mercado inmobiliario en ${zone.zone_name}, Tijuana. Precio promedio: ${formatCurrency(zone.avg_price_per_m2)}/m².`,
  };
}

export default async function ZonePage({ params }: ZonePageProps) {
  const { slug } = await params;
  const zone = TIJUANA_ZONES.find((z) => z.zone_slug === slug);
  if (!zone) notFound();

  const cityAvg = TIJUANA_CITY_METRICS.avg_price_per_m2;
  const diffFromCity = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100;
  const isAboveAvg = diffFromCity > 0;

  // Generate contextual insight based on zone data
  const insight = generateZoneInsight(zone, cityAvg);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Tijuana
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[var(--accent)] text-sm mb-1">
          <MapPin className="h-4 w-4" />
          <span>Tijuana, Baja California</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {zone.zone_name}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Análisis detallado del mercado inmobiliario en {zone.zone_name}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtitle={isAboveAvg ? "Por encima del promedio" : "Por debajo del promedio"}
          icon={<Building className="h-5 w-5" />}
        />
      </div>

      {/* AI Insight */}
      <InsightCard title={`Análisis de ${zone.zone_name}`} content={insight} />

      {/* Breakdown by Property Type */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por tipo de propiedad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(PROPERTY_LABELS) as PropertyType[]).map((type) => {
              const count = zone.listings_by_type[type];
              const ticket = zone.avg_ticket_by_type[type];
              if (count === 0) return null;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors"
                >
                  <div>
                    <p className="font-medium">{PROPERTY_LABELS[type]}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {count} propiedades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(ticket)}</p>
                    <Badge variant="default" className="text-xs">
                      ticket prom.
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      {zone.price_trend_pct > 3 && (
        <section className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">
            {zone.zone_name} muestra alto crecimiento
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6">
            Si estás planeando un desarrollo en esta zona, gestiona tu comercialización
            con las herramientas de Narrativa360.
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
      )}
    </div>
  );
}

function generateZoneInsight(zone: typeof TIJUANA_ZONES[0], cityAvg: number): string {
  const diffPct = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100;
  const topType = Object.entries(zone.listings_by_type).sort(([, a], [, b]) => b - a)[0];
  const topLabel = PROPERTY_LABELS[topType[0] as PropertyType].toLowerCase();

  const parts: string[] = [];

  if (diffPct > 10) {
    parts.push(`${zone.zone_name} se posiciona como una de las zonas premium de Tijuana, con precios ${diffPct.toFixed(0)}% por encima del promedio de la ciudad.`);
  } else if (diffPct < -10) {
    parts.push(`${zone.zone_name} ofrece precios ${Math.abs(diffPct).toFixed(0)}% por debajo del promedio de Tijuana, representando una zona de entrada accesible para inversión.`);
  } else {
    parts.push(`${zone.zone_name} se encuentra en línea con el promedio general de Tijuana en términos de precio por metro cuadrado.`);
  }

  parts.push(`La oferta se concentra en ${topLabel} (${topType[1]} de ${zone.total_listings} propiedades activas).`);

  if (zone.price_trend_pct > 4) {
    parts.push(`Con un crecimiento del ${zone.price_trend_pct}%, muestra una tendencia alcista fuerte que sugiere alta demanda en la zona.`);
  } else if (zone.price_trend_pct < 0) {
    parts.push(`La tendencia a la baja del ${Math.abs(zone.price_trend_pct)}% podría representar una oportunidad de compra para inversionistas atentos.`);
  }

  return parts.join(" ");
}
