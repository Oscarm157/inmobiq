import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { HeroHeader } from "@/components/hero-header"
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
        {(() => {
          const sorted = [...publicZones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
          const topZone = sorted[0]
          const totalListings = publicZones.reduce((s, z) => s + z.total_listings, 0)

          return (
            <HeroHeader
              badge={`${publicZones.length} zonas monitoreadas`}
              badgeIcon="location_on"
              title={<>Zonas de<br /><span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">Tijuana</span></>}
              subtitle={topZone ? `Desde $${Math.round(sorted[sorted.length - 1].avg_price_per_m2 / 1000)}K hasta $${Math.round(topZone.avg_price_per_m2 / 1000)}K por m². Selecciona una zona para su análisis completo.` : "Explora el mercado inmobiliario por zona."}
              accent="teal"
              compact
            />
          )
        })()}
      </FadeInUp>

      <FadeInUp><Suspense fallback={<div className="h-10 bg-surface-inset rounded-lg animate-pulse" />}>
        <ZonesGridClient zones={publicZones} />
      </Suspense></FadeInUp>
    </StaggerContainer>
  )
}
