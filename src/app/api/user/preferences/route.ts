import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const VALID_CATEGORIAS = new Set(["residencial", "comercial", "terreno"])
const VALID_OPERACIONES = new Set(["venta", "renta"])

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, string> = {}

  if (body.categoria && VALID_CATEGORIAS.has(body.categoria)) {
    updates.preferred_categoria = body.categoria
  }
  if (body.operacion && VALID_OPERACIONES.has(body.operacion)) {
    updates.preferred_operacion = body.operacion
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid preferences" }, { status: 400 })
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates as never)
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
