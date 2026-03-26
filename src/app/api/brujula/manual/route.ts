import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import type { PropertyType, ListingType } from "@/types/database"
import { getZoneDataForValuation } from "@/lib/brujula/zone-comparison"
import { computeValuation } from "@/lib/brujula/scoring"
import { generateNarrative } from "@/lib/brujula/narrative"

export const maxDuration = 60

interface ManualBody {
  property_type: PropertyType
  listing_type: ListingType
  price_mxn: number
  area_m2: number
  area_construccion_m2?: number | null
  area_terreno_m2?: number | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  zone_slug: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Rate limit
    const limitKey = user
      ? `brujula:${user.id}`
      : `brujula-anon:${request.headers.get("x-forwarded-for") ?? "unknown"}`
    const limitCount = user ? 10 : 1
    const limited = await rateLimit(limitKey, limitCount, 86_400_000)
    if (limited) return limited

    // Anonymous free-use check
    if (!user) {
      const freeUsed = request.cookies.get("brujula_free_used")
      if (freeUsed) {
        return NextResponse.json(
          { error: "Crea una cuenta gratuita para seguir usando Brújula" },
          { status: 401 },
        )
      }
    }

    const body = await request.json().catch(() => null) as ManualBody | null
    if (!body) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    // Validate
    if (!body.property_type || !body.listing_type || !body.price_mxn || !body.area_m2 || !body.zone_slug) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      )
    }

    if (body.price_mxn <= 0 || body.area_m2 <= 0) {
      return NextResponse.json(
        { error: "Precio y área deben ser mayores a 0" },
        { status: 400 },
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get zone comparison data
    const zoneData = await getZoneDataForValuation(
      body.zone_slug,
      body.listing_type,
      body.property_type,
    )

    if (!zoneData) {
      return NextResponse.json(
        { error: `No hay datos suficientes para la zona seleccionada` },
        { status: 404 },
      )
    }

    // Compute valuation
    const valuationResult = computeValuation(
      {
        price_mxn: body.price_mxn,
        area_m2: body.area_m2,
        property_type: body.property_type,
        listing_type: body.listing_type,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
      },
      zoneData,
    )

    // Generate AI narrative
    const narrativeResult = await generateNarrative({
      result: valuationResult,
      property_type: body.property_type,
      listing_type: body.listing_type,
      price_mxn: body.price_mxn,
      area_m2: body.area_m2,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      address: null,
    })

    // Get zone_id
    const { data: zoneRow } = await sb
      .from("zones")
      .select("id")
      .eq("slug", body.zone_slug)
      .single()

    // Create valuation row
    const { data: valuation, error: insertError } = await sb
      .from("valuations")
      .insert({
        user_id: user?.id ?? null,
        status: "completed",
        input_mode: "manual",
        property_type: body.property_type,
        listing_type: body.listing_type,
        price_mxn: body.price_mxn,
        area_construccion_m2: body.area_construccion_m2 ?? (body.property_type !== "terreno" ? body.area_m2 : null),
        area_terreno_m2: body.area_terreno_m2 ?? (body.property_type === "terreno" ? body.area_m2 : null),
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        parking: body.parking,
        zone_id: zoneRow?.id ?? null,
        zone_slug: body.zone_slug,
        zone_assignment_method: "manual",
        valuation_result: valuationResult,
        verdict: valuationResult.verdict,
        score: valuationResult.score,
        narrative: narrativeResult.text,
        ai_model: narrativeResult.model,
        ai_input_tokens: narrativeResult.input_tokens,
        ai_output_tokens: narrativeResult.output_tokens,
      })
      .select("id")
      .single()

    if (insertError || !valuation) {
      console.error("[brujula/manual] Insert error:", insertError)
      return NextResponse.json({ error: "Error guardando valuación" }, { status: 500 })
    }

    // Set free-use cookie for anonymous users
    const response = NextResponse.json({
      valuationId: valuation.id,
      result: valuationResult,
      narrative: narrativeResult.text,
    })

    if (!user) {
      response.cookies.set("brujula_free_used", "1", {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
      })
    }

    return response
  } catch (err) {
    console.error("[brujula/manual] Error:", err)
    return NextResponse.json(
      { error: "Error procesando valuación" },
      { status: 500 },
    )
  }
}
