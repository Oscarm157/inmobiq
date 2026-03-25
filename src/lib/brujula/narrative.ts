/**
 * Brújula — AI narrative generation.
 * Uses Claude to generate a human-readable interpretation of the valuation.
 */

import type { ValuationResult, PropertyType, ListingType } from "@/types/database"

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  casa: "casa",
  departamento: "departamento",
  terreno: "terreno",
  local: "local comercial",
  oficina: "oficina",
}

const VERDICT_LABELS: Record<string, string> = {
  muy_barata: "muy por debajo del mercado (ganga)",
  barata: "por debajo del promedio",
  precio_justo: "a precio de mercado",
  cara: "por encima del promedio",
  muy_cara: "muy por encima del mercado",
}

interface NarrativeInput {
  result: ValuationResult
  property_type: PropertyType
  listing_type: ListingType
  price_mxn: number
  area_m2: number
  bedrooms: number | null
  bathrooms: number | null
  address: string | null
}

interface NarrativeResult {
  text: string
  input_tokens: number
  output_tokens: number
  model: string
}

export async function generateNarrative(input: NarrativeInput): Promise<NarrativeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      text: buildTemplatedNarrative(input),
      input_tokens: 0,
      output_tokens: 0,
      model: "template",
    }
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const client = new Anthropic({ apiKey })
  const model = "claude-haiku-4-5-20251001"

  const { result: r } = input
  const typeLabel = PROPERTY_TYPE_LABELS[input.property_type]
  const opLabel = input.listing_type === "venta" ? "venta" : "renta"
  const verdictLabel = VERDICT_LABELS[r.verdict] ?? r.verdict

  const prompt = `Eres un asesor inmobiliario experto en el mercado de Tijuana, México. Genera una narrativa de 2-3 párrafos interpretando los siguientes datos de valuación para un cliente.

Datos de la propiedad:
- Tipo: ${typeLabel} en ${opLabel}
- Precio: $${input.price_mxn.toLocaleString("es-MX")} MXN
- Área: ${input.area_m2} m²
- Precio/m²: $${Math.round(r.price_per_m2).toLocaleString("es-MX")} MXN
${input.bedrooms ? `- Recámaras: ${input.bedrooms}` : ""}
${input.bathrooms ? `- Baños: ${input.bathrooms}` : ""}
${input.address ? `- Ubicación: ${input.address}` : ""}

Zona: ${r.zone_name}
- Precio promedio/m² de la zona: $${Math.round(r.zone_avg_price_per_m2).toLocaleString("es-MX")} MXN
- Diferencia vs zona: ${r.price_premium_pct > 0 ? "+" : ""}${r.price_premium_pct.toFixed(1)}%
- Percentil: ${r.price_percentile} (de 100 propiedades en la zona, ${r.price_percentile} son más baratas)
- Inventario en zona: ${r.zone_total_listings} propiedades activas
- Tendencia semanal: ${r.price_trend_pct > 0 ? "+" : ""}${r.price_trend_pct.toFixed(1)}%
- Riesgo: ${r.risk_label} (${r.risk_score}/100)
- Liquidez: ${r.liquidity_score}/100
- NSE de la zona: ${r.nse_label}
${r.cap_rate !== null ? `- Cap rate: ${r.cap_rate.toFixed(1)}%` : ""}

Veredicto: ${verdictLabel} (score ${r.score}/100)
Razones: ${r.verdict_reasons.join(". ")}

Instrucciones:
- Escribe en español, tono profesional pero accesible
- NO uses emojis
- Primer párrafo: resumen ejecutivo del veredicto y contexto de la zona
- Segundo párrafo: análisis de precio comparativo con datos específicos
- Tercer párrafo (opcional): factores de riesgo/oportunidad y recomendación
- Sé directo y concreto. Usa los números del análisis.
- NO inventes datos que no estén arriba
- Máximo 200 palabras total`

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""

    return {
      text: text.trim() || buildTemplatedNarrative(input),
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      model,
    }
  } catch (err) {
    console.error("[brujula/narrative] AI error, falling back to template:", err)
    return {
      text: buildTemplatedNarrative(input),
      input_tokens: 0,
      output_tokens: 0,
      model: "template-fallback",
    }
  }
}

/** Templated fallback when AI is unavailable */
function buildTemplatedNarrative(input: NarrativeInput): string {
  const { result: r } = input
  const typeLabel = PROPERTY_TYPE_LABELS[input.property_type]
  const opLabel = input.listing_type === "venta" ? "venta" : "renta"

  const priceFormatted = `$${input.price_mxn.toLocaleString("es-MX")}`
  const priceM2Formatted = `$${Math.round(r.price_per_m2).toLocaleString("es-MX")}`
  const zoneAvgFormatted = `$${Math.round(r.zone_avg_price_per_m2).toLocaleString("es-MX")}`

  const direction = r.price_premium_pct > 0 ? "por encima" : "por debajo"
  const absPct = Math.abs(r.price_premium_pct).toFixed(1)

  let text = `Esta ${typeLabel} en ${opLabel} en ${r.zone_name} tiene un precio de ${priceFormatted} MXN (${priceM2Formatted}/m²). `

  if (Math.abs(r.price_premium_pct) < 5) {
    text += `El precio está alineado con el promedio de la zona (${zoneAvgFormatted}/m²). `
  } else {
    text += `El precio/m² está ${absPct}% ${direction} del promedio de la zona (${zoneAvgFormatted}/m²). `
  }

  text += `Se ubica en el percentil ${r.price_percentile} — es decir, ${r.price_percentile}% de las propiedades similares en la zona tienen un precio menor.`

  if (r.price_trend_pct > 3) {
    text += ` La zona muestra una tendencia alcista (+${r.price_trend_pct.toFixed(1)}%), lo que podría representar apreciación a corto plazo.`
  } else if (r.price_trend_pct < -3) {
    text += ` La zona muestra una tendencia bajista (${r.price_trend_pct.toFixed(1)}%), lo cual podría abrir espacio para negociación.`
  }

  return text
}
