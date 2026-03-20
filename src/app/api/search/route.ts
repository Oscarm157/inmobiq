import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { TIJUANA_ZONES, MOCK_LISTINGS } from "@/lib/mock-data"
import type { Listing, ZoneMetrics } from "@/types/database"

export interface SearchSuggestion {
  type: "zona" | "propiedad"
  id: string
  title: string
  subtitle: string
  href: string
}

export interface SearchResults {
  zonas: SearchSuggestion[]
  propiedades: SearchSuggestion[]
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M MXN`
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K MXN`
  return `$${price.toLocaleString("es-MX")} MXN`
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (q.length < 3) {
    return NextResponse.json<SearchResults>({ zonas: [], propiedades: [] })
  }

  const lower = q.toLowerCase()

  try {
    if (useMock()) {
      const zonas: SearchSuggestion[] = TIJUANA_ZONES
        .filter((z: ZoneMetrics) =>
          z.zone_name.toLowerCase().includes(lower) ||
          z.zone_slug.includes(lower)
        )
        .slice(0, 4)
        .map((z) => ({
          type: "zona",
          id: z.zone_id,
          title: z.zone_name,
          subtitle: `${z.total_listings} propiedades · $${z.avg_price_per_m2.toLocaleString("es-MX")}/m²`,
          href: `/zona/${z.zone_slug}`,
        }))

      const propiedades: SearchSuggestion[] = MOCK_LISTINGS
        .filter((l: Listing) => l.title.toLowerCase().includes(lower))
        .slice(0, 5)
        .map((l) => ({
          type: "propiedad",
          id: l.id,
          title: l.title,
          subtitle: `${formatPrice(l.price)} · ${l.area_m2}m² · ${l.property_type}`,
          href: `/buscar?q=${encodeURIComponent(q)}`,
        }))

      return NextResponse.json<SearchResults>({ zonas, propiedades })
    }

    const supabase = await createSupabaseServerClient()

    // Search zones
    const zonesRes = await supabase
      .from("zones")
      .select("id, name, slug")
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .limit(4)
    const rawZones = (zonesRes.data ?? []) as Array<{ id: string; name: string; slug: string }>

    // Try RPC fn_search_listings first, fall back to ILIKE
    let listingsData: Listing[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcRes = await (supabase as any).rpc("fn_search_listings", { query: q, limit_count: 5 })
    if (rpcRes.error || !rpcRes.data?.length) {
      const ilike = await supabase
        .from("listings")
        .select("id, title, price, area_m2, property_type, listing_type")
        .ilike("title", `%${q}%`)
        .limit(5)
      listingsData = (ilike.data as Listing[]) ?? []
    } else {
      listingsData = rpcRes.data as Listing[]
    }

    const zonas: SearchSuggestion[] = rawZones.map((z) => ({
      type: "zona",
      id: z.id,
      title: z.name,
      subtitle: "Ver análisis de zona",
      href: `/zona/${z.slug}`,
    }))

    const propiedades: SearchSuggestion[] = listingsData.map((l) => ({
      type: "propiedad",
      id: l.id,
      title: l.title,
      subtitle: `${formatPrice(l.price)} · ${l.area_m2}m² · ${l.property_type}`,
      href: `/buscar?q=${encodeURIComponent(q)}`,
    }))

    // Fallback to mock if both are empty
    if (!zonas.length && !propiedades.length) {
      const mockZonas = TIJUANA_ZONES
        .filter((z: ZoneMetrics) => z.zone_name.toLowerCase().includes(lower))
        .slice(0, 4)
        .map((z) => ({
          type: "zona" as const,
          id: z.zone_id,
          title: z.zone_name,
          subtitle: `${z.total_listings} propiedades · $${z.avg_price_per_m2.toLocaleString("es-MX")}/m²`,
          href: `/zona/${z.zone_slug}`,
        }))

      const mockPropiedades = MOCK_LISTINGS
        .filter((l: Listing) => l.title.toLowerCase().includes(lower))
        .slice(0, 5)
        .map((l) => ({
          type: "propiedad" as const,
          id: l.id,
          title: l.title,
          subtitle: `${formatPrice(l.price)} · ${l.area_m2}m² · ${l.property_type}`,
          href: `/buscar?q=${encodeURIComponent(q)}`,
        }))

      return NextResponse.json<SearchResults>({ zonas: mockZonas, propiedades: mockPropiedades })
    }

    return NextResponse.json<SearchResults>({ zonas, propiedades })
  } catch {
    return NextResponse.json<SearchResults>({ zonas: [], propiedades: [] })
  }
}
