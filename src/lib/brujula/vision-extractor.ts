/**
 * Brújula — Claude Vision extractor for property screenshots.
 * Sends 1-5 screenshots to Claude Vision and extracts structured property data.
 */

import type { ExtractedPropertyData } from "@/types/database"

const EXTRACTION_PROMPT = `Eres un experto en bienes raíces mexicanos. Analiza las siguientes capturas de pantalla de un listado de propiedad en un portal inmobiliario.

Extrae TODOS los datos que puedas identificar. Responde SOLO con JSON válido, sin texto adicional.

{
  "title": string | null,
  "property_type": "casa" | "departamento" | "terreno" | "local" | "oficina" | null,
  "listing_type": "venta" | "renta" | null,
  "price": number | null,
  "currency": "MXN" | "USD" | null,
  "area_m2": number | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "parking": number | null,
  "address": string | null,
  "colonia": string | null,
  "features": string[],
  "confidence_notes": string[]
}

Reglas importantes:
- El precio SIEMPRE es el número principal grande. Si dice "MXN" o "$" sin indicar USD/dlls, es MXN.
- Si el precio dice "USD", "dlls", "dólares", la moneda es USD.
- El área se mide en m². Si ves "m2", "metros", "m²", extrae el número.
- Para "colonia": busca la colonia, fraccionamiento, zona o municipio mencionado en la dirección.
- Para "property_type": casa (incluye "casa sola", "residencia"), departamento (incluye "depto", "flat", "penthouse"), terreno (incluye "lote"), local (incluye "bodega", "nave"), oficina.
- En "features": incluye amenidades como alberca, jardín, terraza, seguridad 24h, roof garden, gym, etc.
- En "confidence_notes": indica cualquier dato que no pudiste leer claramente o que podría estar mal.
- Si una propiedad dice "pre-venta" o "preventa", el listing_type sigue siendo "venta".
- Si ves "renta", "alquiler", "mensual", el listing_type es "renta".
- Parking: busca "estacionamiento", "cajones", "garage", "cochera".
- Si hay varias capturas, consolida la información de todas en un solo JSON.`

interface ExtractionUsage {
  input_tokens: number
  output_tokens: number
  model: string
}

export interface VisionExtractionResult {
  data: ExtractedPropertyData
  usage: ExtractionUsage
}

/**
 * Extract property data from 1-5 screenshots using Claude Vision.
 * @param screenshots - Array of { buffer, mimeType } for each screenshot
 * @returns Extracted structured data + API usage info
 */
export async function extractFromScreenshots(
  screenshots: { buffer: Buffer; mimeType: string }[],
): Promise<VisionExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada")
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const client = new Anthropic({ apiKey })

  const model = "claude-sonnet-4-20250514"

  const imageContent = screenshots.map((s) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: s.mimeType as "image/jpeg" | "image/png" | "image/webp",
      data: s.buffer.toString("base64"),
    },
  }))

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  const empty: ExtractedPropertyData = {
    title: null,
    property_type: null,
    listing_type: null,
    price: null,
    currency: null,
    area_m2: null,
    area_construccion_m2: null,
    area_terreno_m2: null,
    bedrooms: null,
    bathrooms: null,
    parking: null,
    address: null,
    colonia: null,
    features: [],
    confidence_notes: ["No se pudo parsear la respuesta del modelo"],
  }

  if (!jsonMatch) {
    return {
      data: empty,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model,
      },
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>

    const data: ExtractedPropertyData = {
      title: typeof parsed.title === "string" ? parsed.title : null,
      property_type: isValidPropertyType(parsed.property_type) ? parsed.property_type : null,
      listing_type: parsed.listing_type === "venta" || parsed.listing_type === "renta" ? parsed.listing_type : null,
      price: typeof parsed.price === "number" ? parsed.price : null,
      currency: parsed.currency === "MXN" || parsed.currency === "USD" ? parsed.currency : null,
      area_m2: typeof parsed.area_m2 === "number" ? parsed.area_m2 : null,
      area_construccion_m2: typeof parsed.area_construccion_m2 === "number" ? parsed.area_construccion_m2 : null,
      area_terreno_m2: typeof parsed.area_terreno_m2 === "number" ? parsed.area_terreno_m2 : null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : null,
      parking: typeof parsed.parking === "number" ? parsed.parking : null,
      address: typeof parsed.address === "string" ? parsed.address : null,
      colonia: typeof parsed.colonia === "string" ? parsed.colonia : null,
      features: Array.isArray(parsed.features)
        ? parsed.features.filter((f): f is string => typeof f === "string")
        : [],
      confidence_notes: Array.isArray(parsed.confidence_notes)
        ? parsed.confidence_notes.filter((n): n is string => typeof n === "string")
        : [],
    }

    return {
      data,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model,
      },
    }
  } catch {
    return {
      data: empty,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model,
      },
    }
  }
}

function isValidPropertyType(v: unknown): v is ExtractedPropertyData["property_type"] {
  return (
    v === "casa" ||
    v === "departamento" ||
    v === "terreno" ||
    v === "local" ||
    v === "oficina"
  )
}
