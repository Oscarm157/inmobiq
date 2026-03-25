import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data, error } = await sb
      .from("valuations")
      .select("id, status, input_mode, property_type, listing_type, price_mxn, area_m2, zone_slug, verdict, score, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[brujula/history] Error:", error)
      return NextResponse.json({ error: "Error cargando historial" }, { status: 500 })
    }

    return NextResponse.json({ valuations: data ?? [] })
  } catch (err) {
    console.error("[brujula/history] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
