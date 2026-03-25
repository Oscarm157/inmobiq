import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {}

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("zones").select("id").limit(1)
    checks.database = error ? "error" : "ok"
  } catch {
    checks.database = "error"
  }

  const allOk = Object.values(checks).every((v) => v === "ok")

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks },
    { status: allOk ? 200 : 503 }
  )
}
