import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import type { PropertyType, ListingType } from "@/types/database"
import { getZoneDataForValuation } from "@/lib/brujula/zone-comparison"
import { computeValuation } from "@/lib/brujula/scoring"
import { generateNarrative } from "@/lib/brujula/narrative"
import { assignZone } from "@/scraper/zone-assigner"

export const maxDuration = 60

interface ConfirmBody {
  valuationId: string
  property_type: PropertyType
  listing_type: ListingType
  price_mxn: number
  area_m2: number
  area_construccion_m2?: number | null
  area_terreno_m2?: number | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  address: string | null
  zone_slug: string | null // null = auto-assign
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json().catch(() => null) as ConfirmBody | null
    if (!body) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    // Validate required fields
    if (!body.valuationId || !body.property_type || !body.listing_type || !body.price_mxn || !body.area_m2) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: tipo, operación, precio y m²" },
        { status: 400 },
      )
    }

    if (body.price_mxn <= 0 || body.area_m2 <= 0) {
      return NextResponse.json(
        { error: "Precio y área deben ser mayores a 0" },
        { status: 400 },
      )
    }

    // Use admin client for DB writes (bypasses RLS — access control handled above)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createSupabaseAdminClient() as any

    // Verify valuation exists and belongs to user (or is anonymous)
    const { data: existing } = await sb
      .from("valuations")
      .select("id, user_id, ai_input_tokens, ai_output_tokens")
      .eq("id", body.valuationId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Valuación no encontrada" }, { status: 404 })
    }
    if (existing.user_id && existing.user_id !== user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Zone assignment
    let zoneSlug = body.zone_slug
    let assignmentMethod = "manual"

    if (!zoneSlug && body.address) {
      // Auto-assign using zone-assigner
      const { data: zones } = await sb
        .from("zones")
        .select("id, name, slug, lat, lng")

      if (zones && zones.length > 0) {
        const result = assignZone(null, null, body.address, null, zones)
        if (result.zoneId) {
          const matched = zones.find((z: { id: string }) => z.id === result.zoneId)
          if (matched) {
            zoneSlug = matched.slug
            assignmentMethod = result.method
          }
        }
      }
    }

    if (!zoneSlug) {
      return NextResponse.json(
        { error: "No se pudo determinar la zona. Selecciona una zona manualmente." },
        { status: 400 },
      )
    }

    // Get zone comparison data
    const zoneData = await getZoneDataForValuation(
      zoneSlug,
      body.listing_type,
      body.property_type,
    )

    if (!zoneData) {
      return NextResponse.json(
        { error: `No hay datos suficientes para la zona ${zoneSlug}` },
        { status: 404 },
      )
    }

    // Compute valuation
    const valuationResult = computeValuation(
      {
        price_mxn: body.price_mxn,
        area_m2: body.area_m2,
        area_construccion_m2: body.area_construccion_m2,
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
      address: body.address,
    })

    // Get zone_id for DB storage
    const { data: zoneRow } = await sb
      .from("zones")
      .select("id")
      .eq("slug", zoneSlug)
      .single()

    // Update valuation row
    await sb
      .from("valuations")
      .update({
        property_type: body.property_type,
        listing_type: body.listing_type,
        price_mxn: body.price_mxn,
        area_construccion_m2: body.area_construccion_m2 ?? (body.property_type !== "terreno" ? body.area_m2 : null),
        area_terreno_m2: body.area_terreno_m2 ?? (body.property_type === "terreno" ? body.area_m2 : null),
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        parking: body.parking,
        address: body.address,
        zone_id: zoneRow?.id ?? null,
        zone_slug: zoneSlug,
        zone_assignment_method: assignmentMethod,
        valuation_result: valuationResult,
        verdict: valuationResult.verdict,
        score: valuationResult.score,
        narrative: narrativeResult.text,
        ai_input_tokens: (existing.ai_input_tokens ?? 0) + narrativeResult.input_tokens,
        ai_output_tokens: (existing.ai_output_tokens ?? 0) + narrativeResult.output_tokens,
        status: "completed",
      })
      .eq("id", body.valuationId)

    return NextResponse.json({
      valuationId: body.valuationId,
      result: valuationResult,
      narrative: narrativeResult.text,
    })
  } catch (err) {
    console.error("[brujula/confirm] Error:", err)
    return NextResponse.json(
      { error: "Error procesando valuación" },
      { status: 500 },
    )
  }
}
