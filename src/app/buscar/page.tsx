import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { MOCK_LISTINGS, TIJUANA_ZONES } from "@/lib/mock-data"
import { Icon } from "@/components/icon"
import { Price } from "@/components/price"
import type { Listing, ZoneMetrics } from "@/types/database"

export function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Metadata {
  return {
    title: "Búsqueda — Inmobiq",
    description: "Resultados de búsqueda de propiedades en Tijuana",
  }
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`
  return `$${price.toLocaleString("es-MX")}`
}

async function getSearchResults(q: string) {
  const lower = q.toLowerCase()

  if (useMock()) {
    const zonas = TIJUANA_ZONES.filter(
      (z: ZoneMetrics) =>
        z.zone_name.toLowerCase().includes(lower) ||
        z.zone_slug.includes(lower)
    )
    const propiedades = MOCK_LISTINGS.filter((l: Listing) =>
      l.title.toLowerCase().includes(lower)
    )
    return { zonas, propiedades }
  }

  try {
    const supabase = await createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [zonesRes, rpcRes] = await Promise.all([
      supabase
        .from("zones")
        .select("*")
        .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(8),
      (supabase as any).rpc("fn_search_listings", { query: q, limit_count: 20 }),
    ])

    let propiedades: Listing[] = (rpcRes.data as Listing[]) ?? []

    if (!propiedades.length || rpcRes.error) {
      const ilike = await supabase
        .from("listings")
        .select("*")
        .ilike("title", `%${q}%`)
        .limit(20)
      propiedades = (ilike.data as Listing[]) ?? []
    }

    const rawZones = (zonesRes.data ?? []) as Array<{ id: string; name: string; slug: string }>
    const zonas: ZoneMetrics[] = rawZones.map((z) => ({
      zone_id: z.id,
      zone_name: z.name,
      zone_slug: z.slug,
      avg_price_per_m2: 0,
      price_trend_pct: 0,
      avg_ticket: 0,
      total_listings: 0,
      listings_by_type: {} as ZoneMetrics["listings_by_type"],
      avg_ticket_by_type: {} as ZoneMetrics["avg_ticket_by_type"],
    }))

    if (!zonas.length && !propiedades.length) {
      return {
        zonas: TIJUANA_ZONES.filter((z) => z.zone_name.toLowerCase().includes(lower)),
        propiedades: MOCK_LISTINGS.filter((l) => l.title.toLowerCase().includes(lower)),
      }
    }

    return { zonas, propiedades }
  } catch {
    return {
      zonas: TIJUANA_ZONES.filter((z: ZoneMetrics) => z.zone_name.toLowerCase().includes(lower)),
      propiedades: MOCK_LISTINGS.filter((l: Listing) => l.title.toLowerCase().includes(lower)),
    }
  }
}

async function SearchContent({ q }: { q: string }) {
  const { zonas, propiedades } = await getSearchResults(q)
  const total = zonas.length + propiedades.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon name="search_off" className="text-slate-400 text-2xl" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Sin resultados</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          No encontramos nada para &ldquo;{q}&rdquo;. Intenta con otro término, zona o tipo de propiedad.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        {total} resultado{total !== 1 ? "s" : ""} para &ldquo;{q}&rdquo;
      </p>

      {/* Zonas */}
      {zonas.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Zonas ({zonas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zonas.map((zona) => (
              <Link
                key={zona.zone_id}
                href={`/zona/${zona.zone_slug}`}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Icon name="location_on" className="text-blue-600 text-base" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{zona.zone_name}</p>
                  {zona.total_listings > 0 && (
                    <p className="text-xs text-slate-400">{zona.total_listings} propiedades</p>
                  )}
                </div>
                <Icon name="chevron_right" className="text-slate-300 text-sm ml-auto flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Propiedades */}
      {propiedades.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Propiedades ({propiedades.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {propiedades.map((listing) => (
              <div
                key={listing.id}
                className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="home" className="text-slate-500 text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-snug mb-1">{listing.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <Price value={listing.price} className="font-semibold text-slate-700" />
                    <span>·</span>
                    <span>{listing.area_m2}m²</span>
                    <span>·</span>
                    <span className="capitalize">{listing.property_type}</span>
                    <span>·</span>
                    <span className="capitalize">{listing.listing_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Inicio
          </Link>
          <Icon name="chevron_right" className="text-slate-300 text-xs" />
          <span className="text-sm text-slate-600">Búsqueda</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {query ? `Resultados: ${query}` : "Buscar propiedades"}
        </h1>
      </div>

      {query.length < 3 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Icon name="search" className="text-slate-400 text-2xl" />
          </div>
          <p className="text-sm text-slate-400 max-w-xs">
            Ingresa al menos 3 caracteres para buscar zonas y propiedades en Tijuana.
          </p>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex items-center gap-3 py-12">
              <span className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Buscando...</span>
            </div>
          }
        >
          <SearchContent q={query} />
        </Suspense>
      )}
    </div>
  )
}
