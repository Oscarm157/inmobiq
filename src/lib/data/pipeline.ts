import { PIPELINE_PROJECTS_EXTENDED } from "@/lib/mock-data"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { PipelineProject } from "@/types/database"

/**
 * Returns pipeline projects from Supabase.
 * Falls back to mock data if the table doesn't exist yet or query fails.
 */
export async function getPipelineProjects(): Promise<PipelineProject[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return PIPELINE_PROJECTS_EXTENDED
  }

  try {
    const supabase = await createSupabaseServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("pipeline_projects")
      .select("id, zone_slug, zones(name), name, status, status_label, badge_color, description, units_total, units_sold, price_range, delivery_date, img_url, investors, investor_label")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      return PIPELINE_PROJECTS_EXTENDED
    }

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      zone_slug: row.zone_slug as string,
      zone_name: (row.zones as { name: string } | null)?.name ?? "",
      name: row.name as string,
      status: row.status as PipelineProject["status"],
      status_label: row.status_label as string,
      badge_color: row.badge_color as string,
      description: row.description as string,
      units_total: row.units_total as number,
      units_sold: row.units_sold as number,
      price_range: row.price_range as string,
      delivery_date: row.delivery_date as string,
      img: (row.img_url as string) ?? "",
      investors: row.investors as number,
      investor_label: row.investor_label as string,
    }))
  } catch {
    return PIPELINE_PROJECTS_EXTENDED
  }
}
