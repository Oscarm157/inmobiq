import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import { PERFIL_KEYS, type PerfilType } from "@/lib/profiles"

const VALID_PERFILES = new Set<string>(PERFIL_KEYS)
const VALID_OPERACIONES = new Set(["venta", "renta"])
const VALID_CATEGORIAS = new Set(["residencial", "comercial", "terreno"])
const VALID_SOURCES = new Set(["google", "redes_sociales", "recomendacion", "otro"])

interface PatchBody {
  perfil?: string
  default_operacion?: string
  default_categoria?: string
  phone?: string
  referral_source?: string
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as PatchBody

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const limited = await rateLimit(`perfil:${user.id}`, 10, 3_600_000)
    if (limited) return limited

    // Build update object with only valid fields
    const update: Record<string, string | null> = {}

    if (body.perfil !== undefined) {
      if (!VALID_PERFILES.has(body.perfil)) return NextResponse.json({ error: "Invalid perfil" }, { status: 400 })
      update.perfil = body.perfil
    }
    if (body.default_operacion !== undefined) {
      if (body.default_operacion !== null && !VALID_OPERACIONES.has(body.default_operacion))
        return NextResponse.json({ error: "Invalid default_operacion" }, { status: 400 })
      update.default_operacion = body.default_operacion
    }
    if (body.default_categoria !== undefined) {
      if (body.default_categoria !== null && !VALID_CATEGORIAS.has(body.default_categoria))
        return NextResponse.json({ error: "Invalid default_categoria" }, { status: 400 })
      update.default_categoria = body.default_categoria
    }
    if (body.phone !== undefined) {
      update.phone = body.phone || null
    }
    if (body.referral_source !== undefined) {
      if (body.referral_source !== null && !VALID_SOURCES.has(body.referral_source))
        return NextResponse.json({ error: "Invalid referral_source" }, { status: 400 })
      update.referral_source = body.referral_source
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("user_profiles") as any)
      .update(update)
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
