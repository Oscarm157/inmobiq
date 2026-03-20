"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { ZoneMetrics, Listing } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"

export interface ZoneTrendPoint {
  month: string
  [zoneSlug: string]: number | string
}

export interface ZoneComparisonData {
  zones: ZoneMetrics[]
  trendSeries: ZoneTrendPoint[]
}

export interface ComparisonListing extends Listing {
  zone_slug: string
  zone_name: string
}

export async function getZoneComparisonData(
  allZones: ZoneMetrics[],
  slugs: string[],
  _filters?: ListingFilters
): Promise<ZoneComparisonData> {
  const zones = slugs
    .map((slug) => allZones.find((z) => z.zone_slug === slug))
    .filter(Boolean) as ZoneMetrics[]

  if (!zones.length) return { zones: [], trendSeries: [] }

  try {
    const supabase = createSupabaseBrowserClient()

    const { data: zoneRows } = await supabase
      .from("zones")
      .select("id, slug")
      .in("slug", slugs)

    const zoneIdMap = Object.fromEntries(
      (zoneRows ?? []).map((z: { id: string; slug: string }) => [z.slug, z.id])
    )

    const zoneIds = slugs.map((s) => zoneIdMap[s]).filter(Boolean)

    if (!zoneIds.length) return { zones, trendSeries: [] }

    const snapshotResults = await Promise.all(
      zoneIds.map((zoneId) =>
        supabase
          .from("snapshots")
          .select("week_start, avg_price_per_m2, total_listings")
          .eq("zone_id", zoneId)
          .order("week_start", { ascending: true })
          .limit(12)
      )
    )

    const weekSet = new Set<string>()
    snapshotResults.forEach((res) => {
      ;(res.data ?? []).forEach((row: { week_start: string }) => weekSet.add(row.week_start))
    })
    const weeks = Array.from(weekSet).sort()

    const trendSeries: ZoneTrendPoint[] = weeks.map((week) => {
      const date = new Date(week)
      const month = date.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
      const point: ZoneTrendPoint = {
        month: month.charAt(0).toUpperCase() + month.slice(1),
      }
      slugs.forEach((slug, i) => {
        const row = (snapshotResults[i]?.data ?? []).find(
          (r: { week_start: string }) => r.week_start === week
        )
        if (row) {
          point[slug] = Number((row as { avg_price_per_m2: number }).avg_price_per_m2)
        }
      })
      return point
    })

    return { zones, trendSeries }
  } catch {
    return { zones, trendSeries: [] }
  }
}
