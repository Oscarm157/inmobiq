import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { TIJUANA_ZONES } from "@/lib/mock-data"
import type { ZoneMetrics } from "@/types/database"

export interface SearchSuggestion {
  type: "zona"
  id: string
  title: string
  subtitle: string
  href: string
}

export interface SearchResults {
  zonas: SearchSuggestion[]
}

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (q.length < 3) {
    return NextResponse.json<SearchResults>({ zonas: [] })
  }

  const lower = q.toLowerCase()

  try {
    if (useMock()) {
      const zonas: SearchSuggestion[] = TIJUANA_ZONES
        .filter((z: ZoneMetrics) =>
          z.zone_name.toLowerCase().includes(lower) ||
          z.zone_slug.includes(lower)
        )
        .slice(0, 6)
        .map((z) => ({
          type: "zona",
          id: z.zone_id,
          title: z.zone_name,
          subtitle: `$${z.avg_price_per_m2.toLocaleString("es-MX")}/m² · ${z.total_listings} listings activos`,
          href: `/zona/${z.zone_slug}`,
        }))

      return NextResponse.json<SearchResults>({ zonas })
    }

    const supabase = await createSupabaseServerClient()

    const zonesRes = await supabase
      .from("zones")
      .select("id, name, slug")
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .limit(6)
    const rawZones = (zonesRes.data ?? []) as Array<{ id: string; name: string; slug: string }>

    const zonas: SearchSuggestion[] = rawZones.map((z) => ({
      type: "zona",
      id: z.id,
      title: z.name,
      subtitle: "Ver análisis de zona",
      href: `/zona/${z.slug}`,
    }))

    // Fallback to mock if empty
    if (!zonas.length) {
      const mockZonas = TIJUANA_ZONES
        .filter((z: ZoneMetrics) => z.zone_name.toLowerCase().includes(lower))
        .slice(0, 6)
        .map((z) => ({
          type: "zona" as const,
          id: z.zone_id,
          title: z.zone_name,
          subtitle: `$${z.avg_price_per_m2.toLocaleString("es-MX")}/m² · ${z.total_listings} listings activos`,
          href: `/zona/${z.zone_slug}`,
        }))

      return NextResponse.json<SearchResults>({ zonas: mockZonas })
    }

    return NextResponse.json<SearchResults>({ zonas })
  } catch {
    return NextResponse.json<SearchResults>({ zonas: [] })
  }
}
