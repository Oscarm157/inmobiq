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

    // Traer snapshots recientes para mostrar $/m² en el preview
    type SnapshotRow = { zone_id: string; listing_type: string; week_start: string; avg_price_per_m2: number | null; count_active: number }
    let snapshotsByZone: Record<string, { venta?: number; renta?: number }> = {}

    if (rawZones.length > 0) {
      const zoneIds = rawZones.map((z) => z.id)
      const snapshotsRes = await supabase
        .from("snapshots")
        .select("zone_id, listing_type, week_start, avg_price_per_m2, count_active")
        .in("zone_id", zoneIds)
        .order("week_start", { ascending: false })
        .limit(zoneIds.length * 20) // suficiente para cubrir ambas operaciones y varios tipos

      const rows = (snapshotsRes.data ?? []) as SnapshotRow[]

      // Para cada zona, tomar la semana más reciente por listing_type y calcular avg ponderado
      for (const zoneId of zoneIds) {
        const zoneRows = rows.filter((r) => r.zone_id === zoneId)
        const result: { venta?: number; renta?: number } = {}

        for (const lt of ["venta", "renta"] as const) {
          const ltRows = zoneRows.filter((r) => r.listing_type === lt && r.avg_price_per_m2)
          if (!ltRows.length) continue
          const latestWeek = ltRows[0].week_start
          const weekRows = ltRows.filter((r) => r.week_start === latestWeek)
          const totalCount = weekRows.reduce((s, r) => s + (r.count_active ?? 0), 0)
          if (totalCount > 0) {
            const weighted = weekRows.reduce((s, r) => s + (r.avg_price_per_m2 ?? 0) * (r.count_active ?? 0), 0)
            result[lt] = weighted / totalCount
          } else if (weekRows.length > 0) {
            const avg = weekRows.reduce((s, r) => s + (r.avg_price_per_m2 ?? 0), 0) / weekRows.length
            result[lt] = avg
          }
        }
        snapshotsByZone[zoneId] = result
      }
    }

    const zonas: SearchSuggestion[] = rawZones.map((z) => {
      const prices = snapshotsByZone[z.id] ?? {}
      const parts: string[] = []
      if (prices.venta) parts.push(`$${Math.round(prices.venta).toLocaleString("es-MX")}/m² venta`)
      if (prices.renta) parts.push(`$${Math.round(prices.renta).toLocaleString("es-MX")}/m² renta`)
      const subtitle = parts.length > 0 ? parts.join(" · ") : "Ver análisis de zona"
      return {
        type: "zona",
        id: z.id,
        title: z.name,
        subtitle,
        href: `/zona/${z.slug}`,
      }
    })

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
