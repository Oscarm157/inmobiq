import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import type { DataReportChartType, Database } from "@/types/database"

type DataReportInsert = Database["public"]["Tables"]["data_reports"]["Insert"]

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Rate limit: 10 reports per hour per user
  const limited = await rateLimit(`data-reports:${user.id}`, 10, 3_600_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { zone_slug, chart_type, chart_context, description } = body as {
    zone_slug?: string
    chart_type?: string
    chart_context?: Record<string, unknown>
    description?: string
  }

  if (!zone_slug || !chart_type || !description) {
    return NextResponse.json(
      { error: "zone_slug, chart_type y description son requeridos" },
      { status: 400 },
    )
  }

  const validChartTypes = new Set(["price_distribution", "scatter", "concentration", "ticket_promedio", "other"])
  if (!validChartTypes.has(chart_type)) {
    return NextResponse.json({ error: "chart_type inválido" }, { status: 400 })
  }

  const insertData: DataReportInsert = {
    user_id: user.id,
    zone_slug,
    chart_type: chart_type as DataReportChartType,
    chart_context: chart_context ?? {},
    description,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not yet in generated types
  const { data: report, error } = await (supabase as any)
    .from("data_reports")
    .insert(insertData)
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json(
      { error: `Error guardando reporte: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json(report, { status: 201 })
}
