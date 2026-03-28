import { createSupabaseServerClient } from "@/lib/supabase-server"

export interface TrendPoint {
  weekStart: string   // ISO date string (Monday)
  pricePerM2: number
  isReal: boolean     // true = from snapshot, false = mock
}

/** Simple seeded PRNG for deterministic mock data per zone */
function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h * 1664525 + 1013904223) | 0
    return (h >>> 0) / 4294967296
  }
}

/** Get Monday of a given week offset from today */
function getMonday(weeksAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1 - weeksAgo * 7)
  return d.toISOString().split("T")[0]
}

/**
 * Get 10 weeks of price/m² trend data for a zone.
 * Uses real snapshots when available, fills gaps with deterministic mock data.
 */
export async function getZoneTrendData(zoneSlug: string, currentPricePerM2: number): Promise<TrendPoint[]> {
  const WEEKS = 10

  // Try to fetch real snapshot data
  let realData: Map<string, number> = new Map()

  try {
    const supabase = await createSupabaseServerClient()

    // Get zone ID
    const { data: zoneRow } = await supabase
      .from("zones")
      .select("id")
      .eq("slug", zoneSlug)
      .single() as { data: { id: string } | null }

    if (zoneRow) {
      const { data: snapshots } = await supabase
        .from("snapshots")
        .select("week_start, avg_price_per_m2")
        .eq("zone_id", zoneRow.id)
        .gt("avg_price_per_m2", 0)
        .order("week_start", { ascending: false })
        .limit(WEEKS) as { data: Array<{ week_start: string; avg_price_per_m2: number }> | null }

      if (snapshots) {
        for (const s of snapshots) {
          const existing = realData.get(s.week_start)
          if (!existing || Number(s.avg_price_per_m2) > 0) {
            realData.set(s.week_start, Number(s.avg_price_per_m2))
          }
        }
      }
    }
  } catch {
    // Fall through to mock
  }

  // Build 10-week series
  const rand = seededRandom(zoneSlug)
  const points: TrendPoint[] = []

  // Start from current price and work backwards for mock
  let price = currentPricePerM2

  for (let i = 0; i < WEEKS; i++) {
    const weekStart = getMonday(i)
    const realPrice = realData.get(weekStart)

    if (realPrice && realPrice > 0) {
      points.unshift({ weekStart, pricePerM2: Math.round(realPrice), isReal: true })
      price = realPrice // anchor mock to real data
    } else {
      // Mock: vary ±1-3% from next week's price (going backwards)
      if (i === 0) {
        points.unshift({ weekStart, pricePerM2: Math.round(price), isReal: false })
      } else {
        const variation = (rand() - 0.45) * 0.04 // slight upward bias
        price = price / (1 + variation)
        points.unshift({ weekStart, pricePerM2: Math.round(price), isReal: false })
      }
    }
  }

  return points
}

/**
 * Compute trend KPIs from trend data.
 */
export function computeTrendKPIs(points: TrendPoint[]) {
  const current = points[points.length - 1]?.pricePerM2 ?? 0

  // 4-week variation
  const fourWeeksAgo = points[points.length - 5]?.pricePerM2 ?? current
  const var4w = fourWeeksAgo > 0 ? ((current - fourWeeksAgo) / fourWeeksAgo) * 100 : 0

  // 10-week variation
  const tenWeeksAgo = points[0]?.pricePerM2 ?? current
  const var10w = tenWeeksAgo > 0 ? ((current - tenWeeksAgo) / tenWeeksAgo) * 100 : 0

  // Momentum: same direction = confirmed, different = divergent
  const momentum: "confirmado" | "divergente" | "estable" =
    var4w === 0 && var10w === 0 ? "estable" :
    (var4w > 0 && var10w > 0) || (var4w < 0 && var10w < 0) ? "confirmado" : "divergente"

  const realWeeks = points.filter((p) => p.isReal).length

  return {
    var4w: Number(var4w.toFixed(1)),
    var10w: Number(var10w.toFixed(1)),
    momentum,
    realWeeks,
  }
}
