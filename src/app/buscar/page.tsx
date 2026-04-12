import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { effectivePriceMxn } from "@/lib/data/normalize"
import { MOCK_LISTINGS, TIJUANA_ZONES } from "@/lib/mock-data"
import { Icon } from "@/components/icon"
import { Breadcrumb } from "@/components/breadcrumb"
import { HeroHeader } from "@/components/hero-header"
import { SearchInput } from "./search-input"
import { Price } from "@/components/price"
import type { Listing, ZoneMetrics } from "@/types/database"

export function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Metadata {
  return {
    title: "Búsqueda — Inmobiq",
    description: "Resultados de búsqueda de propiedades en Tijuana",
  }
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

function getMockSearchResults(query: string) {
  const lower = query.toLowerCase()

  return {
    zonas: TIJUANA_ZONES.filter(
      (z: ZoneMetrics) =>
        z.zone_name.toLowerCase().includes(lower) ||
        z.zone_slug.includes(lower)
    ),
    propiedades: MOCK_LISTINGS.filter((l: Listing) =>
      l.title.toLowerCase().includes(lower)
    ),
  }
}

function mapSearchRowToListing(row: Record<string, unknown>): Listing | null {
  const price =
    typeof row.price === "number"
      ? row.price
      : effectivePriceMxn(
          typeof row.price_mxn === "number" ? row.price_mxn : null,
          typeof row.price_usd === "number" ? row.price_usd : null,
        )

  if (!price || price <= 0) return null

  const areaM2 = typeof row.area_m2 === "number" ? row.area_m2 : 0

  return {
    id: String(row.id ?? ""),
    zone_id: String(row.zone_id ?? ""),
    title: String(row.title ?? ""),
    property_type: row.property_type as Listing["property_type"],
    listing_type: row.listing_type as Listing["listing_type"],
    price,
    area_m2: areaM2,
    area_construccion_m2: typeof row.area_construccion_m2 === "number" ? row.area_construccion_m2 : null,
    area_terreno_m2: typeof row.area_terreno_m2 === "number" ? row.area_terreno_m2 : null,
    price_per_m2: typeof row.price_per_m2 === "number" ? row.price_per_m2 : areaM2 > 0 ? price / areaM2 : 0,
    bedrooms: typeof row.bedrooms === "number" ? row.bedrooms : null,
    bathrooms: typeof row.bathrooms === "number" ? row.bathrooms : null,
    source: (row.source ?? row.source_portal ?? "otro") as Listing["source"],
    source_url: String(row.source_url ?? row.external_url ?? ""),
    scraped_at: String(row.scraped_at ?? row.created_at ?? ""),
    created_at: String(row.created_at ?? row.scraped_at ?? ""),
  }
}

async function getSearchResults(q: string) {
  if (useMock()) {
    return getMockSearchResults(q)
  }

  try {
    const supabase = await createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [zonesRes, rpcRes] = await Promise.all([
      supabase
        .from("zones")
        .select("id, name, slug")
        .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(8),
      (supabase as any).rpc("fn_search_listings", { p_query: q, p_limit: 20 }),
    ])

    let propiedades = ((rpcRes.data ?? []) as Array<Record<string, unknown>>)
      .map(mapSearchRowToListing)
      .filter((listing): listing is Listing => listing !== null)

    if (!propiedades.length || rpcRes.error) {
      const ilike = await supabase
        .from("listings")
        .select(`
          id, zone_id, title, property_type, listing_type,
          price_mxn, price_usd, area_m2, area_construccion_m2, area_terreno_m2,
          bedrooms, bathrooms, source_portal, external_url, scraped_at, created_at
        `)
        .eq("is_active", true)
        .ilike("title", `%${q}%`)
        .order("scraped_at", { ascending: false })
        .limit(20)
      propiedades = ((ilike.data ?? []) as Array<Record<string, unknown>>)
        .map(mapSearchRowToListing)
        .filter((listing): listing is Listing => listing !== null)
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

    return { zonas, propiedades }
  } catch {
    return getMockSearchResults(q)
  }
}

async function SearchContent({ q }: { q: string }) {
  const { zonas, propiedades } = await getSearchResults(q)
  const total = zonas.length + propiedades.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-inset flex items-center justify-center mb-4">
          <Icon name="search_off" className="text-muted-foreground text-2xl" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Sin resultados</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          No encontramos nada para &ldquo;{q}&rdquo;. Intenta con otro término, zona o tipo de propiedad.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {total} resultado{total !== 1 ? "s" : ""} para &ldquo;{q}&rdquo;
      </p>

      {/* Zonas */}
      {zonas.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Zonas ({zonas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zonas.map((zona) => (
              <Link
                key={zona.zone_id}
                href={`/zona/${zona.zone_slug}`}
                className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-kpi-icon-blue flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon name="location_on" className="text-blue-600 dark:text-blue-400 text-base" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{zona.zone_name}</p>
                  {zona.total_listings > 0 && (
                    <p className="text-xs text-muted-foreground">{zona.total_listings} propiedades</p>
                  )}
                </div>
                <Icon name="chevron_right" className="text-muted-foreground/50 text-sm ml-auto flex-shrink-0 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Propiedades */}
      {propiedades.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Propiedades ({propiedades.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {propiedades.map((listing) => (
              <div
                key={listing.id}
                className="flex items-start gap-3 p-4 bg-surface rounded-2xl border border-border/50 hover:border-border hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-inset flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="home" className="text-muted-foreground text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug mb-1">{listing.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Price value={listing.price} className="font-semibold text-foreground" />
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
      <Breadcrumb items={[{ label: "Búsqueda" }]} />
      <HeroHeader
        badge="Explorar"
        badgeIcon="travel_explore"
        title={query ? <>{`Resultados: `}<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{query}</span></> : <><span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Buscar</span>{` zonas`}</>}
        subtitle="Zonas, colonias, desarrollos inmobiliarios — encuentra lo que necesitas."
        accent="blue"
        compact
      />

      <SearchInput initialQuery={query} />

      {query.length < 3 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="search" className="text-4xl text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Escribe al menos 3 caracteres para buscar.
          </p>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex items-center gap-3 py-12">
              <span className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          }
        >
          <SearchContent q={query} />
        </Suspense>
      )}
    </div>
  )
}
