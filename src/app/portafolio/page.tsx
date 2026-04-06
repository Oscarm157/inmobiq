import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthGatedSection } from "@/components/auth-gated-section"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { getPortfolioPresets } from "@/lib/data/portfolio"
import { getZoneMetrics } from "@/lib/data/zones"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getListings } from "@/lib/data/listings"
import { PortafolioClient } from "./portafolio-client"
import { ExportButton } from "@/components/export-button"
import { HeroHeader, HeroFeature } from "@/components/hero-header"
import { SectionHeading } from "@/components/section-heading"
import { ListingCard } from "@/components/listing-card"
import { ListingsFilters } from "@/components/listings-filters"
import { PortfolioMapWrapper } from "@/components/map/portfolio-map-wrapper"
import type { PropertyType, ListingType, Listing } from "@/types/database"

export const metadata = {
  title: "Explorador de Portafolios — Inmobiq",
  description: "Explora estrategias de inversión predefinidas y propiedades activas en Tijuana.",
}

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

export default async function PortafolioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const filters = {
    tipos: sp.tipo ? (sp.tipo.split(",") as PropertyType[]) : undefined,
    zonas: sp.zona ? sp.zona.split(",") : undefined,
    listing_type: (sp.operacion as ListingType) || undefined,
    precio_min: sp.precio_min ? Number(sp.precio_min) : undefined,
    precio_max: sp.precio_max ? Number(sp.precio_max) : undefined,
    area_min: sp.area_min ? Number(sp.area_min) : undefined,
    area_max: sp.area_max ? Number(sp.area_max) : undefined,
    recamaras: sp.rec ? sp.rec.split(",").map(Number) : undefined,
  }

  const [presets, zones, { data: riskData }, { listings, total }] = await Promise.all([
    Promise.resolve(getPortfolioPresets()),
    getZoneMetrics(),
    getZoneRiskMetrics(),
    getListings(filters),
  ])

  return (
    <StaggerContainer className="space-y-10">
      <FadeInUp><Breadcrumb items={[{ label: "Portafolio" }]} /></FadeInUp>
      {/* Hero Header */}
      <FadeInUp>
        <HeroHeader
          badge={`${total} propiedades activas`}
          badgeIcon="account_balance"
          title={<>Explorador de<br /><span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Portafolios</span></>}
          subtitle={`Analiza ${zones.filter(z => z.zone_slug !== "otros").length} zonas con ${presets.length} estrategias predefinidas. Filtra por tipo, precio, superficie y más.`}
          accent="blue"
          actions={<ExportButton formats={["listings-excel", "listings-csv"]} />}
        >
          <HeroFeature icon="psychology" label="Estrategias inteligentes" desc="Presets por perfil de riesgo e inversión" color="blue" />
          <HeroFeature icon="pin_drop" label="Mapa en tiempo real" desc="Propiedades geolocalizadas por zona" color="emerald" />
          <HeroFeature icon="tune" label="Filtros quirúrgicos" desc="Precio, m², recámaras, zona, tipo" color="violet" />
        </HeroHeader>
      </FadeInUp>

      <AuthGatedSection>
      <FadeInUp><PortafolioClient presets={presets} zones={zones} riskData={riskData} /></FadeInUp>

      {/* Propiedades Section */}
      <FadeInUp><section>
        <SectionHeading
          title="Propiedades"
          subtitle="Filtra el inventario activo por tipo, zona, precio y más"
          size="lg"
        />

        {/* Map view of filtered listings */}
        <div className="mb-6">
          <PortfolioMapWrapper zones={zones} />
        </div>

        <div className="flex gap-6 items-start">
          {/* Filter Sidebar (desktop) + Bottom Sheet trigger (mobile) */}
          <Suspense fallback={
            <div className="w-60 shrink-0 hidden md:block space-y-4">
              <div className="h-8 rounded-lg bg-surface-inset animate-pulse" />
              <div className="h-64 rounded-xl bg-surface-inset animate-pulse" />
            </div>
          }>
            <ListingsFilters total={total} />
          </Suspense>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {listings.length === 0 ? (
              <div className="bg-surface rounded-xl card-shadow p-12 text-center">
                <p className="text-2xl mb-2">🏠</p>
                <p className="text-foreground font-semibold">Sin resultados</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Ajusta los filtros para ver más propiedades
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-muted-foreground mb-4 md:hidden">
                  Propiedades encontradas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section></FadeInUp>
      </AuthGatedSection>
    </StaggerContainer>
  )
}
