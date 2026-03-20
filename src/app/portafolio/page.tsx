import { Suspense } from "react"
import { getPortfolioPresets } from "@/lib/data/portfolio"
import { getZoneMetrics } from "@/lib/data/zones"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getListings } from "@/lib/data/listings"
import { PortafolioClient } from "./portafolio-client"
import { ExportButton } from "@/components/export-button"
import { ListingCard } from "@/components/listing-card"
import { ListingsFilters } from "@/components/listings-filters"
import { PortfolioMapWrapper } from "@/components/map/portfolio-map-wrapper"
import type { PropertyType, ListingType, Listing } from "@/types/database"

export const metadata = {
  title: "Portfolio Explorer — Inmobiq",
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

  const [presets, zones, riskData, { listings, total }] = await Promise.all([
    Promise.resolve(getPortfolioPresets()),
    getZoneMetrics(),
    getZoneRiskMetrics(),
    getListings(filters),
  ])

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              Portfolio Explorer
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Explorador de Portafolios
          </h2>
          <p className="text-slate-500 max-w-xl font-medium">
            Explora estrategias de inversión predefinidas y analiza la composición óptima para tu perfil de riesgo.
          </p>
        </div>
        <ExportButton formats={["listings-excel", "listings-csv"]} />
      </div>

      <PortafolioClient presets={presets} zones={zones} riskData={riskData} />

      {/* Propiedades Section */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-black tracking-tight">Propiedades</h3>
          <p className="text-sm text-slate-500 font-medium">
            Filtra el inventario activo por tipo, zona, precio y más
          </p>
        </div>

        {/* Map view of filtered listings */}
        <div className="mb-6">
          <PortfolioMapWrapper zones={zones} listings={listings as Listing[]} />
        </div>

        <div className="flex gap-6 items-start">
          {/* Filter Sidebar (desktop) + Bottom Sheet trigger (mobile) */}
          <Suspense fallback={null}>
            <ListingsFilters total={total} />
          </Suspense>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl card-shadow p-12 text-center">
                <p className="text-2xl mb-2">🏠</p>
                <p className="text-slate-600 font-semibold">Sin resultados</p>
                <p className="text-slate-400 text-sm mt-1">
                  Ajusta los filtros para ver más propiedades
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-500 mb-4 md:hidden">
                  <span className="text-blue-700 font-black">{total}</span> propiedades encontradas
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
      </section>
    </div>
  )
}
