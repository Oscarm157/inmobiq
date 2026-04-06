import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import { getUserPlan, PLAN_LIMITS } from "@/lib/user-plan"
import { extractFromScreenshots } from "@/lib/brujula/vision-extractor"

export const maxDuration = 60

const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MONTH_MS = 30 * 86_400_000

export async function POST(request: NextRequest) {
  try {
    const planInfo = await getUserPlan()

    // Must be authenticated
    if (!planInfo) {
      return NextResponse.json(
        { error: "Regístrate gratis para usar Brújula" },
        { status: 401 },
      )
    }

    const { plan, userId } = planInfo
    const limit = PLAN_LIMITS[plan].brujula_per_month

    // Monthly rate limit based on plan
    const limited = await rateLimit(`brujula:${userId}`, limit, MONTH_MS)
    if (limited) return limited

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll("screenshots") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "Se requiere al menos 1 screenshot" }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Máximo ${MAX_FILES} screenshots` }, { status: 400 })
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no soportado: ${file.type}. Usa JPEG, PNG o WebP.` },
          { status: 400 },
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Archivo demasiado grande (máx 5MB): ${file.name}` },
          { status: 400 },
        )
      }
    }

    // Create valuation row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: valuation, error: insertError } = await sb
      .from("valuations")
      .insert({
        user_id: user?.id ?? null,
        status: "extracting",
        input_mode: "screenshots",
      })
      .select("id")
      .single()

    if (insertError || !valuation) {
      console.error("[brujula/extract] Insert error:", insertError)
      return NextResponse.json({ error: "Error creando valuación" }, { status: 500 })
    }

    const valuationId = valuation.id as string

    // Upload screenshots to Supabase Storage
    const screenshotPaths: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]
      const path = `${valuationId}/${i}.${ext}`

      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from("valuation-screenshots")
        .upload(path, buffer, { contentType: file.type })

      if (uploadError) {
        console.error(`[brujula/extract] Upload error for file ${i}:`, uploadError)
        // Continue — partial uploads are ok, extraction still works
      } else {
        screenshotPaths.push(path)
      }
    }

    // Update paths
    await sb
      .from("valuations")
      .update({ screenshot_paths: screenshotPaths })
      .eq("id", valuationId)

    // Extract data from screenshots via Claude Vision
    const screenshots = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      })),
    )

    const result = await extractFromScreenshots(screenshots)

    // Update valuation with extracted data
    await sb
      .from("valuations")
      .update({
        extracted_data: result.data,
        ai_model: result.usage.model,
        ai_input_tokens: result.usage.input_tokens,
        ai_output_tokens: result.usage.output_tokens,
        status: "preview",
      })
      .eq("id", valuationId)

    return NextResponse.json({
      valuationId,
      extracted: result.data,
    })
  } catch (err) {
    console.error("[brujula/extract] Error:", err)
    return NextResponse.json(
      { error: "Error procesando screenshots" },
      { status: 500 },
    )
  }
}
