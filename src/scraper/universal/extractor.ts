import type { CheerioAPI } from "cheerio";
import { cleanHtmlForAI } from "./html-cleaner";

/** Raw extracted data before normalization */
export interface ExtractedData {
  title: string | null;
  description: string | null;
  property_type_hint: string | null; // raw text, normalized later
  listing_type_hint: string | null; // raw text, normalized later
  price_text: string | null; // raw price string with currency
  price_amount: number | null;
  currency: string | null; // MXN, USD, etc.
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
}

export interface ExtractionResult {
  data: ExtractedData;
  layers: {
    jsonLd: boolean;
    openGraph: boolean;
    heuristic: boolean;
    ai: boolean;
  };
  confidence: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// Layer 1: JSON-LD
// ---------------------------------------------------------------------------

function extractJsonLd($: CheerioAPI): Partial<ExtractedData> {
  const result: Partial<ExtractedData> = {};
  const scripts = $('script[type="application/ld+json"]');

  scripts.each((_i, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        processJsonLdItem(item, result);
        // Also check @graph
        if (Array.isArray(item["@graph"])) {
          for (const graphItem of item["@graph"]) {
            processJsonLdItem(graphItem, result);
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  return result;
}

function processJsonLdItem(item: Record<string, unknown>, result: Partial<ExtractedData>): void {
  const type = String(item["@type"] ?? "").toLowerCase();

  // Real estate / product / residence types
  const relevantTypes = [
    "realestate", "realestatelisting", "product", "offer",
    "residence", "house", "apartment", "singlefamilyresidence",
    "accommodation", "lodgingbusiness", "place",
  ];

  if (!relevantTypes.some((t) => type.includes(t)) && type !== "itemlist") return;

  // Handle ItemList — pick first item
  if (type === "itemlist" && Array.isArray(item.itemListElement)) {
    const first = item.itemListElement[0] as Record<string, unknown> | undefined;
    if (first) {
      const inner = (first.item ?? first) as Record<string, unknown>;
      processJsonLdItem(inner, result);
    }
    return;
  }

  if (!result.title && item.name) {
    result.title = String(item.name).trim();
  }
  if (!result.description && item.description) {
    result.description = String(item.description).trim();
  }

  // Price from offers
  const offers = item.offers as Record<string, unknown> | undefined;
  if (offers && !result.price_amount) {
    result.price_amount = parseFloat(String(offers.price ?? "")) || null;
    result.currency = String(offers.priceCurrency ?? "MXN").toUpperCase();
    result.price_text = `${result.currency} ${result.price_amount}`;
  }

  // Direct price
  if (!result.price_amount && item.price) {
    result.price_amount = parseFloat(String(item.price)) || null;
    result.currency = String(item.priceCurrency ?? "MXN").toUpperCase();
  }

  // Geo
  const geo = item.geo as Record<string, unknown> | undefined;
  if (geo && !result.lat) {
    result.lat = parseFloat(String(geo.latitude ?? "")) || null;
    result.lng = parseFloat(String(geo.longitude ?? "")) || null;
  }

  // Address
  const address = item.address;
  if (address && !result.address) {
    if (typeof address === "string") {
      result.address = address.trim();
    } else if (typeof address === "object" && address !== null) {
      const a = address as Record<string, unknown>;
      result.address = String(
        a.streetAddress ?? a.addressLocality ?? a.name ?? ""
      ).trim() || null;
    }
  }

  // Floor size / area
  if (!result.area_m2) {
    const fs = item.floorSize as Record<string, unknown> | undefined;
    if (fs?.value) {
      result.area_m2 = parseFloat(String(fs.value)) || null;
    } else if (item.floorSize && typeof item.floorSize !== "object") {
      result.area_m2 = parseFloat(String(item.floorSize)) || null;
    }
  }

  // Rooms
  if (!result.bedrooms && item.numberOfRooms) {
    result.bedrooms = parseInt(String(item.numberOfRooms), 10) || null;
  }
  if (!result.bedrooms && item.numberOfBedrooms) {
    result.bedrooms = parseInt(String(item.numberOfBedrooms), 10) || null;
  }
  if (!result.bathrooms && item.numberOfBathroomsTotal) {
    result.bathrooms = parseInt(String(item.numberOfBathroomsTotal), 10) || null;
  }
  if (!result.bathrooms && item.numberOfBathrooms) {
    result.bathrooms = parseInt(String(item.numberOfBathrooms), 10) || null;
  }

  // Property type hint
  if (!result.property_type_hint) {
    if (type.includes("house") || type.includes("singlefamily")) {
      result.property_type_hint = "casa";
    } else if (type.includes("apartment")) {
      result.property_type_hint = "departamento";
    }
  }

  // Images
  if (!result.images?.length) {
    const img = item.image;
    if (typeof img === "string") {
      result.images = [img];
    } else if (Array.isArray(img)) {
      result.images = img.map(
        (i) => (typeof i === "string" ? i : String((i as Record<string, unknown>).url ?? ""))
      ).filter(Boolean);
    }
  }
}

// ---------------------------------------------------------------------------
// Layer 2: OpenGraph / Meta Tags
// ---------------------------------------------------------------------------

function extractOpenGraph($: CheerioAPI): Partial<ExtractedData> {
  const result: Partial<ExtractedData> = {};

  const og = (prop: string) => $(`meta[property="${prop}"]`).attr("content")?.trim();
  const meta = (name: string) => $(`meta[name="${name}"]`).attr("content")?.trim();

  result.title = og("og:title") ?? meta("title") ?? ($("title").text().trim() || null);
  result.description = og("og:description") ?? meta("description") ?? null;

  // OG image
  const ogImage = og("og:image");
  if (ogImage) {
    result.images = [ogImage];
  }

  // Product price meta tags
  const priceAmount = og("product:price:amount") ?? og("og:price:amount");
  if (priceAmount) {
    result.price_amount = parseFloat(priceAmount) || null;
    result.currency = og("product:price:currency") ?? og("og:price:currency") ?? "MXN";
  }

  // Geo meta tags
  const geoLat = meta("geo.position")?.split(";")[0] ?? meta("ICBM")?.split(",")[0];
  const geoLng = meta("geo.position")?.split(";")[1] ?? meta("ICBM")?.split(",")[1];
  if (geoLat && geoLng) {
    result.lat = parseFloat(geoLat) || null;
    result.lng = parseFloat(geoLng) || null;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Layer 3: CSS Heuristics
// ---------------------------------------------------------------------------

function extractHeuristics($: CheerioAPI): Partial<ExtractedData> {
  const result: Partial<ExtractedData> = {};

  // Price
  const priceSelectors = [
    "[class*='price']", "[class*='precio']", "[data-price]",
    "[class*='Price']", "[class*='Precio']",
    "[itemprop='price']",
  ];
  for (const sel of priceSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().trim();
      if (text && /[\d,.]/.test(text)) {
        result.price_text = text;
        result.price_amount = extractNumber(text);
        result.currency = detectCurrency(text);
        break;
      }
    }
  }

  // Area
  const areaSelectors = [
    "[class*='area']", "[class*='superficie']", "[class*='m2']",
    "[class*='Area']", "[class*='size']", "[itemprop='floorSize']",
  ];
  for (const sel of areaSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const n = extractNumber(el.text());
      if (n && n > 5 && n < 100_000) {
        result.area_m2 = n;
        break;
      }
    }
  }

  // Bedrooms
  const bedSelectors = [
    "[class*='room']", "[class*='recamara']", "[class*='habitacion']",
    "[class*='bed']", "[class*='Room']", "[class*='Bed']",
  ];
  for (const sel of bedSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const n = extractNumber(el.text());
      if (n && n >= 1 && n <= 20) {
        result.bedrooms = n;
        break;
      }
    }
  }

  // Bathrooms
  const bathSelectors = [
    "[class*='bath']", "[class*='bano']", "[class*='Bath']",
    "[class*='Bano']",
  ];
  for (const sel of bathSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const n = extractNumber(el.text());
      if (n && n >= 1 && n <= 20) {
        result.bathrooms = n;
        break;
      }
    }
  }

  // Parking
  const parkingSelectors = [
    "[class*='parking']", "[class*='estacionamiento']", "[class*='garage']",
    "[class*='Parking']",
  ];
  for (const sel of parkingSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const n = extractNumber(el.text());
      if (n && n >= 1 && n <= 20) {
        result.parking = n;
        break;
      }
    }
  }

  // Address
  const addressSelectors = [
    "[class*='address']", "[class*='location']", "[class*='direccion']",
    "[class*='ubicacion']", "[itemprop='address']",
  ];
  for (const sel of addressSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().trim();
      if (text && text.length > 5 && text.length < 500) {
        result.address = text;
        break;
      }
    }
  }

  // Images — collect from main content area
  if (!result.images?.length) {
    const imgs: string[] = [];
    const container = $("main, article, [role='main'], .listing, [class*='gallery'], [class*='photo']");
    const scope = container.length ? container : $("body");
    scope.find("img[src]").each((_i, el) => {
      const src = $(el).attr("src") ?? "";
      if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("pixel") && src.length > 10) {
        imgs.push(src);
      }
    });
    if (imgs.length) {
      result.images = imgs.slice(0, 20);
    }
  }

  // Property type from page text
  if (!result.property_type_hint) {
    const bodyText = $("body").text().toLowerCase();
    if (/\b(casa|house|residencia)\b/.test(bodyText)) {
      result.property_type_hint = "casa";
    } else if (/\b(departamento|depa|apartamento|apartment)\b/.test(bodyText)) {
      result.property_type_hint = "departamento";
    } else if (/\b(terreno|lote|land)\b/.test(bodyText)) {
      result.property_type_hint = "terreno";
    } else if (/\b(local comercial|local\s)\b/.test(bodyText)) {
      result.property_type_hint = "local";
    } else if (/\b(oficina|office)\b/.test(bodyText)) {
      result.property_type_hint = "oficina";
    }
  }

  // Listing type from page text
  if (!result.listing_type_hint) {
    const bodyText = $("body").text().toLowerCase();
    if (/\b(venta|sale|for sale|en venta)\b/.test(bodyText)) {
      result.listing_type_hint = "venta";
    } else if (/\b(renta|rent|alquiler|for rent|en renta)\b/.test(bodyText)) {
      result.listing_type_hint = "renta";
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Layer 4: AI extraction (Claude API)
// ---------------------------------------------------------------------------

async function extractWithAI(html: string): Promise<Partial<ExtractedData>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[extractor] ANTHROPIC_API_KEY not set, skipping AI extraction");
    return {};
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const cleanedHtml = cleanHtmlForAI(html);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Eres un extractor de datos inmobiliarios. Analiza el siguiente HTML de una página de listado inmobiliario mexicano y extrae los datos estructurados.

Responde SOLO con JSON válido, sin texto adicional. Usa null para campos que no encuentres.

{
  "title": string | null,
  "description": string | null,
  "property_type": "casa" | "departamento" | "terreno" | "local" | "oficina" | null,
  "listing_type": "venta" | "renta" | null,
  "price": number | null,
  "currency": "MXN" | "USD" | null,
  "area_m2": number | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "parking": number | null,
  "address": string | null,
  "lat": number | null,
  "lng": number | null,
  "images": string[]
}

HTML:
${cleanedHtml}`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Extract JSON from response (may have markdown code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    return {
      title: parsed.title as string | null,
      description: parsed.description as string | null,
      property_type_hint: parsed.property_type as string | null,
      listing_type_hint: parsed.listing_type as string | null,
      price_amount: typeof parsed.price === "number" ? parsed.price : null,
      currency: parsed.currency as string | null,
      area_m2: typeof parsed.area_m2 === "number" ? parsed.area_m2 : null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : null,
      parking: typeof parsed.parking === "number" ? parsed.parking : null,
      address: parsed.address as string | null,
      lat: typeof parsed.lat === "number" ? parsed.lat : null,
      lng: typeof parsed.lng === "number" ? parsed.lng : null,
      images: Array.isArray(parsed.images) ? parsed.images.filter((i): i is string => typeof i === "string") : [],
    };
  } catch {
    console.error("[extractor] Failed to parse AI response");
    return {};
  }
}

// ---------------------------------------------------------------------------
// Main extraction pipeline
// ---------------------------------------------------------------------------

/**
 * Run the 4-layer extraction pipeline.
 * Layers merge progressively — earlier layers have priority.
 * AI (Layer 4) only runs if critical fields are missing after layers 1-3.
 */
export async function extractFromPage(
  $: CheerioAPI,
  html: string,
): Promise<ExtractionResult> {
  const layers = { jsonLd: false, openGraph: false, heuristic: false, ai: false };

  // Empty base
  const data: ExtractedData = {
    title: null,
    description: null,
    property_type_hint: null,
    listing_type_hint: null,
    price_text: null,
    price_amount: null,
    currency: null,
    area_m2: null,
    bedrooms: null,
    bathrooms: null,
    parking: null,
    address: null,
    lat: null,
    lng: null,
    images: [],
  };

  // Layer 1: JSON-LD
  const jsonLdData = extractJsonLd($);
  if (Object.values(jsonLdData).some((v) => v !== null && v !== undefined)) {
    layers.jsonLd = true;
    mergeExtracted(data, jsonLdData);
  }

  // Layer 2: OpenGraph
  const ogData = extractOpenGraph($);
  if (Object.values(ogData).some((v) => v !== null && v !== undefined)) {
    layers.openGraph = true;
    mergeExtracted(data, ogData);
  }

  // Layer 3: Heuristics
  const heuristicData = extractHeuristics($);
  if (Object.values(heuristicData).some((v) => v !== null && v !== undefined)) {
    layers.heuristic = true;
    mergeExtracted(data, heuristicData);
  }

  // Layer 4: AI — only if critical fields missing
  const missingCritical = !data.price_amount || !data.property_type_hint || !data.listing_type_hint;
  if (missingCritical) {
    try {
      const aiData = await extractWithAI(html);
      if (Object.values(aiData).some((v) => v !== null && v !== undefined)) {
        layers.ai = true;
        mergeExtracted(data, aiData);
      }
    } catch (err) {
      console.error("[extractor] AI extraction failed:", err);
    }
  }

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  const hasCritical = !!data.price_amount && !!data.property_type_hint && !!data.listing_type_hint;
  if (hasCritical && (layers.jsonLd || layers.openGraph)) {
    confidence = "high";
  } else if (hasCritical) {
    confidence = "medium";
  }

  return { data, layers, confidence };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Merge source into target, only filling null fields */
function mergeExtracted(target: ExtractedData, source: Partial<ExtractedData>): void {
  for (const key of Object.keys(source) as (keyof ExtractedData)[]) {
    const sourceVal = source[key];
    if (sourceVal === null || sourceVal === undefined) continue;

    if (key === "images") {
      // Append unique images
      const existing = new Set(target.images);
      for (const img of sourceVal as string[]) {
        if (!existing.has(img)) {
          target.images.push(img);
        }
      }
    } else if (target[key] === null || target[key] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any)[key] = sourceVal;
    }
  }
}

function extractNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/[\d]+\.?\d*/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return isNaN(n) ? null : n;
}

function detectCurrency(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("usd") || t.includes("us$") || t.includes("dlls") || t.includes("dólares") || t.includes("dolares")) {
    return "USD";
  }
  return "MXN";
}
