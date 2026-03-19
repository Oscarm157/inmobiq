import { createSupabaseServerClient } from "@/lib/supabase-server"
import { PRICE_TREND_DATA } from "@/lib/mock-data"

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

export interface PriceTrendPoint {
  month: string
  avg_price_m2: number
  listings: number
}

type CitySnapshotRow = {
  week_start: string
  avg_price_per_m2: number
  total_listings: number
}

export async function getPriceTrendData(): Promise<PriceTrendPoint[]> {
  if (useMock()) return PRICE_TREND_DATA

  try {
    const supabase = await createSupabaseServerClient()

    const res = await supabase
      .from("city_snapshots")
      .select("week_start, avg_price_per_m2, total_listings")
      .order("week_start", { ascending: true })
      .limit(12)

    const data = res.data as CitySnapshotRow[] | null

    if (!data?.length) return PRICE_TREND_DATA

    return data.map((row) => {
      const date = new Date(row.week_start)
      const month = date.toLocaleDateString("es-MX", {
        month: "short",
        year: "2-digit",
      })
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        avg_price_m2: Number(row.avg_price_per_m2),
        listings: row.total_listings,
      }
    })
  } catch {
    return PRICE_TREND_DATA
  }
}
