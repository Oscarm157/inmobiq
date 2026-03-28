/**
 * AI-assisted zone classification using Claude Haiku.
 *
 * Used as fallback when text-matching can't resolve a zone.
 * Includes confidence scoring and coordinate cross-validation.
 */

import type { Zone } from "./types";

// ─── Types ─────────────────────────────────────────────────────────

export interface AIClassification {
  slug: string;
  confianza: "alta" | "media" | "baja";
}

export interface HybridResult {
  zoneId: string | null;
  method: "title-strict" | "ai" | "ai+coords" | "none";
  confidence: "alta" | "media" | "baja";
  aiSlug?: string;
}

// ─── Normalization (shared with zone-assigner) ─────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Title strict matching ─────────────────────────────────────────

const ZONE_ALIASES: Record<string, string> = {
  playas: "playas-de-tijuana",
  "zona rio": "zona-rio",
  "rio tijuana": "zona-rio",
  "lomas agua caliente": "lomas-de-agua-caliente",
  "san antonio": "san-antonio-del-mar",
  "real del mar": "real-del-mar",
  "punta bandera": "punta-bandera",
  "costa coronado": "costa-coronado",
  "baja malibu": "baja-malibu",
  "del bosque": "residencial-del-bosque",
  "colinas california": "colinas-de-california",
  "otay centenario": "otay",
  "villa fontana": "villa-fontana",
  "terrazas presa": "terrazas-de-la-presa",
  "el lago": "el-lago-cucapah",
  cucapah: "el-lago-cucapah",
  "lago cucapah": "el-lago-cucapah",
  "cerro colorado": "cerro-colorado",
  "el florido": "el-florido",
  "las americas": "las-americas",
  "la mesa": "la-mesa",
  "buena vista": "buena-vista",
  "santa fe": "santa-fe",
  soler: "soler",
  mirador: "soler",
  cacho: "cacho",
  cumbres: "cacho",
  hipodromo: "hipodromo",
  chapultepec: "chapultepec",
  toreo: "cacho",
  calete: "cacho",
  "mariano matamoros": "la-mesa",
  "san marino": "la-mesa",
  "new city": "zona-rio",
  "city center": "zona-rio",
  "the park": "zona-rio",
  landmark: "zona-rio",
  "presa rodriguez": "terrazas-de-la-presa",
  dorada: "agua-caliente",
  "zona dorada": "agua-caliente",
  "villa del alamo": "hipodromo",
  gabilondo: "cacho",
  ermita: "la-mesa",
  rubi: "centro",
};

interface SearchTerm {
  term: string;
  slug: string;
}

function buildSearchTerms(zones: Zone[]): SearchTerm[] {
  const terms: SearchTerm[] = [];

  for (const z of zones) {
    if (z.slug === "otros") continue;
    const normName = normalize(z.name);
    if (normName.length >= 4) terms.push({ term: normName, slug: z.slug });
    const normSlug = z.slug.replace(/-/g, " ");
    if (normSlug !== normName && normSlug.length >= 4) {
      terms.push({ term: normSlug, slug: z.slug });
    }
  }

  for (const [alias, slug] of Object.entries(ZONE_ALIASES)) {
    const normAlias = normalize(alias);
    if (normAlias.length >= 4) terms.push({ term: normAlias, slug });
  }

  terms.sort((a, b) => b.term.length - a.term.length);

  const seen = new Set<string>();
  return terms.filter((t) => {
    const key = t.term + "|" + t.slug;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Word-boundary matching on title text */
export function matchTitleStrict(title: string | null, zones: Zone[]): string | null {
  if (!title) return null;
  const normText = " " + normalize(title) + " ";
  if (normText.trim().length === 0) return null;

  const searchTerms = buildSearchTerms(zones);
  for (const { term, slug } of searchTerms) {
    const idx = normText.indexOf(term);
    if (idx === -1) continue;
    const before = normText[idx - 1];
    const after = normText[idx + term.length];
    if ((before === " " || before === undefined) && (after === " " || after === undefined)) {
      return slug;
    }
  }
  return null;
}

// ─── Haversine ─────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── AI Prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(zones: Zone[]): string {
  const zoneList = zones
    .filter((z) => z.slug !== "otros")
    .map((z) => `${z.slug}: ${z.name}`)
    .join("\n");

  return `Eres un experto en el mercado inmobiliario de Tijuana, México. Clasifica propiedades en una zona.

ZONAS:
${zoneList}
otros: No se puede determinar

REGLAS:
- Responde SOLO JSON array: [{"idx": N, "slug": "zone-slug", "confianza": "alta|media|baja"}]
- "alta": titulo menciona zona/colonia explícitamente
- "media": se infiere por nombre de desarrollo o referencia geográfica
- "baja": no se puede determinar con certeza → usa "otros"
- "Agua Caliente" ≠ "Lomas de Agua Caliente" (zonas diferentes)
- "Hipódromo" ≠ "Hipódromo-Chapultepec" (zonas diferentes)
- Valparaiso, La Rioja, Verona = desarrollos en santa-fe
- Zona Dorada = agua-caliente
- City Center, The Park, New City, Landmark, Hi Rio = zona-rio
- Toreo, Calete, Gabilondo = cacho
- Mariano Matamoros = la-mesa
- Presa Rodríguez = terrazas-de-la-presa`;
}

// ─── AI batch classification ───────────────────────────────────────

export async function classifyBatchWithAI(
  batch: { idx: number; title: string; description: string; address: string }[],
  zones: Zone[],
): Promise<AIClassification[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in env");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const listingsText = batch
    .map((b) => {
      const desc = b.description ? b.description.slice(0, 200) : "(sin descripción)";
      const addr = b.address || "(sin dirección)";
      return `[${b.idx}] Título: ${b.title}\n    Dirección: ${addr}\n    Descripción: ${desc}`;
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: buildSystemPrompt(zones),
    messages: [
      {
        role: "user",
        content: `Clasifica estas ${batch.length} propiedades:\n\n${listingsText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    return batch.map(() => ({ slug: "otros", confianza: "baja" as const }));
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { idx: number; slug: string; confianza: string }[];
    // Validate slugs
    const validSlugs = new Set(zones.map((z) => z.slug));
    return parsed.map((p) => ({
      slug: validSlugs.has(p.slug) ? p.slug : "otros",
      confianza: (["alta", "media", "baja"].includes(p.confianza) ? p.confianza : "baja") as "alta" | "media" | "baja",
    }));
  } catch {
    return batch.map(() => ({ slug: "otros", confianza: "baja" as const }));
  }
}

// ─── Hybrid classification (single listing) ────────────────────────

/**
 * Hybrid zone classification:
 * 1. Title strict matching (free, deterministic, high precision)
 * 2. AI fallback (for unmatched — higher coverage, context-aware)
 * 3. Coordinate cross-validation (if lat/lng available, verify AI result is plausible)
 *
 * Confidence upgrade/downgrade:
 * - AI says zone X + coords within 5km of zone X → upgrade to "alta"
 * - AI says zone X + coords >8km from zone X → downgrade to "baja"
 * - Script match → always "alta"
 */
export function crossValidateWithCoords(
  aiSlug: string,
  aiConfianza: "alta" | "media" | "baja",
  lat: number | null,
  lng: number | null,
  zones: Zone[],
): { confidence: "alta" | "media" | "baja"; method: "ai" | "ai+coords" } {
  if (lat === null || lng === null || aiSlug === "otros") {
    return { confidence: aiConfianza, method: "ai" };
  }

  const targetZone = zones.find((z) => z.slug === aiSlug);
  if (!targetZone) return { confidence: aiConfianza, method: "ai" };

  const dist = haversineKm(lat, lng, targetZone.lat, targetZone.lng);

  if (dist <= 5) {
    // Coords confirm AI — upgrade confidence
    const upgraded = aiConfianza === "baja" ? "media" : "alta";
    return { confidence: upgraded, method: "ai+coords" };
  } else if (dist > 8) {
    // Coords contradict AI — downgrade
    const downgraded = aiConfianza === "alta" ? "media" : "baja";
    return { confidence: downgraded, method: "ai+coords" };
  }

  return { confidence: aiConfianza, method: "ai+coords" };
}
