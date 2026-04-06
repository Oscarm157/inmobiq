import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthGateServer } from "@/components/auth-gate-server"
import { HeroHeader } from "@/components/hero-header"
import { getZoneMetrics } from "@/lib/data/zones"
import { MapPageClient } from "./map-page-client"
import { ZoneFilters } from "@/components/zone/zone-filters"
import { cookies } from "next/headers"
import { COOKIE_OPERACION, COOKIE_CATEGORIA, parseOperacion, parseCategoria } from "@/lib/preference-cookies"
import type { ZoneMetrics, ListingType } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"
import type { PropertyCategory } from "@/lib/data/normalize"

export const metadata = {
  title: "Mapa Interactivo — Inmobiq",
  description: "Mapa interactivo de Tijuana con zonas y listings geolocalizados.",
}

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<{ operacion?: string; categoria?: string }>
}) {
  const sp = await searchParams
  const cookieStore = await cookies()
  const cookieOp = parseOperacion(cookieStore.get(COOKIE_OPERACION)?.value)
  const cookieCat = parseCategoria(cookieStore.get(COOKIE_CATEGORIA)?.value)

  const VALID_OPS = new Set(["venta", "renta", "todas"])
  const VALID_CATS = new Set(["residencial", "comercial", "terreno", "todas"])

  const rawOp = sp.operacion && VALID_OPS.has(sp.operacion) ? sp.operacion : cookieOp
  const rawCat = sp.categoria && VALID_CATS.has(sp.categoria) ? sp.categoria : cookieCat

  const filters: ListingFilters = {
    listing_type: rawOp !== "todas" ? (rawOp as ListingType) : undefined,
    categoria: rawCat !== "todas" ? (rawCat as PropertyCategory) : undefined,
  }

  const zones = await getZoneMetrics(filters)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Mapa" }]} />
      {(() => {
        const activeZones = zones.filter(z => z.zone_slug !== "otros" && z.total_listings > 0)
        const opLabel = rawOp === "renta" ? "renta" : rawOp === "todas" ? "venta y renta" : "venta"

        return (
          <HeroHeader
            badge={`${activeZones.length} zonas activas`}
            badgeIcon="satellite_alt"
            title={<>Mapa de<br /><span className="bg-gradient-to-r from-teal-400 to-sky-300 bg-clip-text text-transparent">Precios</span></>}
            subtitle={`Visualización geográfica del mercado de ${opLabel} en Tijuana. Cada zona coloreada por precio promedio/m².`}
            accent="teal"
            compact
            actions={
              <Suspense fallback={<div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />}>
                <ZoneFilters defaultOperacion={rawOp === "todas" ? "" : rawOp} defaultCategoria={rawCat === "todas" ? "" : rawCat} />
              </Suspense>
            }
          />
        )
      })()}

      <AuthGateServer>
        <Suspense
          fallback={
            <div className="h-[600px] bg-surface-inset rounded-xl flex items-center justify-center">
              <div className="text-muted-foreground text-sm font-medium">Cargando mapa…</div>
            </div>
          }
        >
          <MapPageClient zones={zones as ZoneMetrics[]} />
        </Suspense>
      </AuthGateServer>
    </div>
  )
}
