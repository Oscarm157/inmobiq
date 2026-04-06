import { NextResponse, type NextRequest } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { rateLimit } from "@/lib/rate-limit"

/**
 * GET /api/admin/analytics?days=7
 * Returns aggregated analytics for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const check = await verifyAdmin()
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const limited = await rateLimit(`admin-analytics:${check.userId}`, 20, 60_000)
  if (limited) return limited

  const days = Math.min(Number(request.nextUrl.searchParams.get("days") ?? 7), 90)
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createSupabaseAdminClient() as any

  // Fetch all events in range
  const { data: events, error } = await sb
    .from("analytics_events")
    .select("event_type, event_name, user_id, session_id, metadata, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50_000)

  if (error) {
    console.error("[admin/analytics] Error:", error)
    return NextResponse.json({ error: "Error cargando analytics" }, { status: 500 })
  }

  const rows = (events ?? []) as Array<{
    event_type: string
    event_name: string
    user_id: string | null
    session_id: string
    metadata: Record<string, unknown>
    created_at: string
  }>

  // --- Aggregate ---

  // 1. Pageviews by page
  const pageviews: Record<string, number> = {}
  const pageviewsWithDuration: Record<string, number[]> = {}
  for (const e of rows) {
    if (e.event_type !== "pageview") continue
    // Skip exit events (they carry duration)
    if (e.metadata?.exit) {
      const path = e.event_name
      if (!pageviewsWithDuration[path]) pageviewsWithDuration[path] = []
      if (typeof e.metadata.duration_ms === "number") {
        pageviewsWithDuration[path].push(e.metadata.duration_ms as number)
      }
      continue
    }
    pageviews[e.event_name] = (pageviews[e.event_name] || 0) + 1
  }

  const topPages = Object.entries(pageviews)
    .map(([path, views]) => {
      const durations = pageviewsWithDuration[path] ?? []
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000)
        : null
      return { path, views, avg_duration_s: avgDuration }
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 20)

  // 2. Feature usage
  const features: Record<string, number> = {}
  for (const e of rows) {
    if (e.event_type === "pageview") continue
    const key = `${e.event_type}:${e.event_name}`
    features[key] = (features[key] || 0) + 1
  }
  const topFeatures = Object.entries(features)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // 3. Unique sessions and users
  const sessions = new Set<string>()
  const users = new Set<string>()
  for (const e of rows) {
    sessions.add(e.session_id)
    if (e.user_id) users.add(e.user_id)
  }

  // 4. Daily activity (pageviews per day)
  const daily: Record<string, { views: number; sessions: Set<string>; users: Set<string> }> = {}
  for (const e of rows) {
    if (e.event_type !== "pageview" || e.metadata?.exit) continue
    const day = e.created_at.slice(0, 10)
    if (!daily[day]) daily[day] = { views: 0, sessions: new Set(), users: new Set() }
    daily[day].views++
    daily[day].sessions.add(e.session_id)
    if (e.user_id) daily[day].users.add(e.user_id)
  }
  const dailyStats = Object.entries(daily)
    .map(([date, d]) => ({ date, views: d.views, sessions: d.sessions.size, users: d.users.size }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // 5. Hourly distribution (for heatmap)
  const hourly = new Array(24).fill(0)
  for (const e of rows) {
    if (e.event_type !== "pageview" || e.metadata?.exit) continue
    const hour = new Date(e.created_at).getHours()
    hourly[hour]++
  }

  return NextResponse.json({
    period: { days, since, total_events: rows.length },
    summary: {
      total_pageviews: Object.values(pageviews).reduce((a, b) => a + b, 0),
      unique_sessions: sessions.size,
      unique_users: users.size,
      anonymous_sessions: sessions.size - users.size,
    },
    top_pages: topPages,
    top_features: topFeatures,
    daily: dailyStats,
    hourly,
  })
}
