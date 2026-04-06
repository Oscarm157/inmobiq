import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const VALID_EVENT_TYPES = new Set(["pageview", "feature", "export", "brujula", "search"])

/**
 * POST /api/analytics — record an analytics event.
 * Lightweight: no auth required, fire-and-forget from client.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    session_id?: string
    event_type?: string
    event_name?: string
    metadata?: Record<string, unknown>
  } | null

  if (!body?.session_id || !body.event_type || !body.event_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (!VALID_EVENT_TYPES.has(body.event_type)) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 })
  }

  // Truncate to avoid abuse
  const sessionId = body.session_id.slice(0, 64)
  const eventName = body.event_name.slice(0, 200)

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  await sb.from("analytics_events").insert({
    session_id: sessionId,
    user_id: user?.id ?? null,
    event_type: body.event_type,
    event_name: eventName,
    metadata: body.metadata ?? {},
  })

  return NextResponse.json({ ok: true })
}
