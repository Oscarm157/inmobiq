import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { PageHeader } from "@/components/page-header"
import { getZoneMetrics } from "@/lib/data/zones"
import { ZonesGridClient } from "./zones-grid-client"

export const revalidate = 3600 // ISR: revalidate every 1 hour

export const metadata = {
  title: "Zonas — Inmobiq",
  description: "Explora todas las zonas inmobiliarias de Tijuana. Compara precios, tendencias e inventario.",
}

export default async function ZonasPage() {
  const zones = await getZoneMetrics()
  const publicZones = zones.filter((z) => z.zone_slug !== "otros")

  return (
    <StaggerContainer className="space-y-6">
      <FadeInUp><Breadcrumb items={[{ label: "Zonas" }]} /></FadeInUp>
      <FadeInUp>
        <PageHeader
          title="Zonas de Tijuana"
          subtitle="Explora el mercado inmobiliario por zona. Haz clic en una zona para ver su análisis completo."
          badges={[
            { label: "Zonas", variant: "blue" },
            { label: `${publicZones.length} zonas`, variant: "neutral" },
          ]}
        />
      </FadeInUp>

      <FadeInUp><Suspense fallback={<div className="h-10 bg-surface-inset rounded-lg animate-pulse" />}>
        <ZonesGridClient zones={publicZones} />
      </Suspense></FadeInUp>
    </StaggerContainer>
  )
}
