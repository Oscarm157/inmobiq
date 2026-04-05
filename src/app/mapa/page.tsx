import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
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
      <HeroHeader
        badge="Mapa Interactivo"
        badgeIcon="map"
        title="Tijuana — Mapa de Precios"
        subtitle="Zonas coloreadas por precio promedio/m². Haz clic en una zona para ver su análisis."
        accent="teal"
        compact
        actions={
          <Suspense fallback={<div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />}>
            <ZoneFilters defaultOperacion={rawOp === "todas" ? "" : rawOp} defaultCategoria={rawCat === "todas" ? "" : rawCat} />
          </Suspense>
        }
      />

      <Suspense
        fallback={
          <div className="h-[600px] bg-surface-inset rounded-xl flex items-center justify-center">
            <div className="text-muted-foreground text-sm font-medium">Cargando mapa…</div>
          </div>
        }
      >
        <MapPageClient zones={zones as ZoneMetrics[]} />
      </Suspense>
    </div>
  )
}
