import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "./supabase-server"

/**
 * Supabase-backed rate limiter that works across Vercel serverless instances.
 * Uses a `rate_limits` table to track request counts per key/window.
 *
 * Returns null if allowed, or a NextResponse 429 if rate-limited.
 *
 * @param key - Unique identifier (e.g. "export-listings:userId")
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const now = Date.now()
    const windowStart = new Date(now - windowMs).toISOString()

    // Count recent requests in this window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not yet in generated types
    const sb = supabase as any
    const { count } = await sb
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart)

    if ((count ?? 0) >= limit) {
      // Find the oldest entry in this window to calculate retry-after
      const { data: oldest } = await sb
        .from("rate_limits")
        .select("created_at")
        .eq("key", key)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      const oldestTime = oldest ? new Date(oldest.created_at).getTime() : now - windowMs
      const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000)

      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(retryAfter, 1)) },
        }
      )
    }

    // Record this request
    await sb
      .from("rate_limits")
      .insert({ key, created_at: new Date(now).toISOString() })

    return null
  } catch {
    // If rate limiting fails (e.g. table doesn't exist), allow the request
    return null
  }
}
