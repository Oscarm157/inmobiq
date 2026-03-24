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
  count_active: number
}

export async function getPriceTrendData(): Promise<PriceTrendPoint[]> {
  if (useMock()) return PRICE_TREND_DATA

  try {
    const supabase = await createSupabaseServerClient()

    const res = await supabase
      .from("city_snapshots")
      .select("week_start, avg_price_per_m2, count_active")
      .order("week_start", { ascending: true })
      .limit(52)

    const data = res.data as CitySnapshotRow[] | null

    if (!data?.length) return []

    return data.map((row) => {
      const date = new Date(row.week_start)
      const month = date.toLocaleDateString("es-MX", {
        month: "short",
        day: "numeric",
      })
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        avg_price_m2: Number(row.avg_price_per_m2),
        listings: row.count_active,
      }
    })
  } catch {
    return []
  }
}
