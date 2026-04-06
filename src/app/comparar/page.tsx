import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthGateServer } from "@/components/auth-gate-server"
import { ComparadorClient } from "./comparador-client"
import { getZoneMetrics } from "@/lib/data/zones"
import { getComparisonListings } from "@/lib/data/comparison-listings"
import { cookies } from "next/headers"
import { COOKIE_OPERACION, COOKIE_CATEGORIA, parseOperacion, parseCategoria } from "@/lib/preference-cookies"
import type { PropertyType, ListingType } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"
import type { PropertyCategory } from "@/lib/data/normalize"

export const metadata = {
  title: "Comparador de Zonas — Inmobiq",
  description: "Compara métricas de hasta 4 zonas de Tijuana lado a lado.",
}

interface SearchParams {
  zonas?: string
  tipo?: string
  operacion?: string
  precio_min?: string
  precio_max?: string
  area_min?: string
  area_max?: string
  rec?: string
}

export default async function ComparadorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const safeNum = (val?: string): number | undefined => {
    if (!val) return undefined
    const n = Number(val)
    return !isNaN(n) && n >= 0 ? n : undefined
  }

  const cookieStore = await cookies()
  const cookieOp = parseOperacion(cookieStore.get(COOKIE_OPERACION)?.value)
  const cookieCat = parseCategoria(cookieStore.get(COOKIE_CATEGORIA)?.value)

  const VALID_TYPES = new Set(["casa", "departamento", "terreno", "local", "oficina"])
  const VALID_OPS = new Set(["venta", "renta"])

  const filters: ListingFilters = {
    tipos: sp.tipo
      ? (sp.tipo.split(",").filter((t) => VALID_TYPES.has(t)) as PropertyType[])
      : undefined,
    listing_type: sp.operacion && VALID_OPS.has(sp.operacion)
      ? (sp.operacion as ListingType)
      : (cookieOp as ListingType),
    categoria: (cookieCat as PropertyCategory),
    precio_min: safeNum(sp.precio_min),
    precio_max: safeNum(sp.precio_max),
    area_min: safeNum(sp.area_min),
    area_max: safeNum(sp.area_max),
    recamaras: sp.rec
      ? sp.rec.split(",").map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 4)
      : undefined,
  }

  const selectedSlugs = sp.zonas
    ? sp.zonas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : []

  const [allZones, listings] = await Promise.all([
    getZoneMetrics(filters),
    Promise.resolve(getComparisonListings(selectedSlugs, filters)),
  ])

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Comparar" }]} />
      <AuthGateServer message="Regístrate gratis para comparar zonas">
        <Suspense>
          <ComparadorClient
            allZones={allZones}
            initialSlugs={selectedSlugs}
            initialListings={listings}
            filters={filters}
          />
        </Suspense>
      </AuthGateServer>
    </div>
  )
}
