import { NextResponse, type NextRequest } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { rateLimit } from "@/lib/rate-limit"

/**
 * GET /api/admin/users — list all users with activity stats
 */
export async function GET() {
  const check = await verifyAdmin()
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const limited = await rateLimit(`admin-users:${check.userId}`, 30, 60_000)
  if (limited) return limited

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createSupabaseAdminClient() as any

  // Get all user profiles
  const { data: users, error: usersErr } = await sb
    .from("user_profiles")
    .select("id, email, full_name, avatar_url, role, perfil, is_active, created_at, last_sign_in_at, updated_at")
    .order("created_at", { ascending: false })

  if (usersErr) {
    console.error("[admin/users] Error fetching users:", usersErr)
    return NextResponse.json({ error: "Error cargando usuarios" }, { status: 500 })
  }

  // Get valuation counts per user
  const { data: valuationStats } = await sb
    .from("valuations")
    .select("user_id")
    .eq("status", "completed")

  const valuationCounts: Record<string, number> = {}
  if (valuationStats) {
    for (const v of valuationStats) {
      if (v.user_id) {
        valuationCounts[v.user_id] = (valuationCounts[v.user_id] || 0) + 1
      }
    }
  }

  // Enrich users with stats
  const enriched = (users ?? []).map((u: Record<string, unknown>) => ({
    ...u,
    valuation_count: valuationCounts[u.id as string] ?? 0,
  }))

  return NextResponse.json({ users: enriched })
}

/**
 * PATCH /api/admin/users — update user (toggle active, change role)
 * Body: { userId: string, is_active?: boolean, role?: "user" | "admin" }
 */
export async function PATCH(request: NextRequest) {
  const check = await verifyAdmin()
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const limited = await rateLimit(`admin-users-patch:${check.userId}`, 30, 60_000)
  if (limited) return limited

  const body = await request.json().catch(() => null) as {
    userId?: string
    is_active?: boolean
    role?: "user" | "admin"
  } | null

  if (!body?.userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 })
  }

  // Prevent self-deactivation or self-demotion
  if (body.userId === check.userId) {
    if (body.is_active === false) {
      return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 })
    }
    if (body.role === "user") {
      return NextResponse.json({ error: "No puedes quitarte el rol de admin" }, { status: 400 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active
  if (body.role === "user" || body.role === "admin") updates.role = body.role

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createSupabaseAdminClient() as any
  const { error } = await sb
    .from("user_profiles")
    .update(updates)
    .eq("id", body.userId)

  if (error) {
    console.error("[admin/users] Update error:", error)
    return NextResponse.json({ error: "Error actualizando usuario" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
