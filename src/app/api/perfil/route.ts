import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { PERFIL_KEYS, type PerfilType } from "@/lib/profiles"

const VALID_PERFILES = new Set<string>(PERFIL_KEYS)

export async function PATCH(req: NextRequest) {
  try {
    const { perfil } = (await req.json()) as { perfil?: string }

    if (!perfil || !VALID_PERFILES.has(perfil)) {
      return NextResponse.json({ error: "Invalid perfil" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("user_profiles") as any)
      .update({ perfil })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
