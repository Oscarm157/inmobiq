#!/usr/bin/env node
/**
 * Zone Text Analysis — validates feasibility of text-based zone classification
 *
 * Analyzes what % of listings have zone/neighborhood info in their title or
 * description that could be used for text-based zone assignment.
 *
 * Usage:
 *   npx tsx scripts/analyze-zone-text.ts
 *   npx tsx scripts/analyze-zone-text.ts --active-only
 */

import * as path from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { createClient } from "@supabase/supabase-js"

// ─── Setup ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const activeOnly = process.argv.includes("--active-only")

// ─── Zone definitions ──────────────────────────────────────────────

const ZONES = [
  { slug: "agua-caliente", name: "Agua Caliente" },
  { slug: "baja-malibu", name: "Baja Malibú" },
  { slug: "buena-vista", name: "Buena Vista" },
  { slug: "cacho", name: "Cacho-Cumbres" },
  { slug: "centro", name: "Centro" },
  { slug: "cerro-colorado", name: "Cerro Colorado" },
  { slug: "chapultepec", name: "Chapultepec" },
  { slug: "colinas-de-california", name: "Colinas de California" },
  { slug: "costa-coronado", name: "Costa Coronado" },
  { slug: "el-florido", name: "El Florido" },
  { slug: "el-lago-cucapah", name: "El Lago-Cucapah" },
  { slug: "hipodromo", name: "Hipódromo" },
  { slug: "hipodromo-chapultepec", name: "Hipódromo-Chapultepec" },
  { slug: "insurgentes", name: "Insurgentes" },
  { slug: "la-mesa", name: "La Mesa" },
  { slug: "las-americas", name: "Las Américas" },
  { slug: "libertad", name: "Libertad" },
  { slug: "lomas-de-agua-caliente", name: "Lomas de Agua Caliente" },
  { slug: "lomas-virreyes", name: "Lomas Virreyes" },
  { slug: "natura", name: "Natura" },
  { slug: "otay", name: "Otay" },
  { slug: "otay-universidad", name: "Otay Universidad" },
  { slug: "playas-de-tijuana", name: "Playas de Tijuana" },
  { slug: "punta-bandera", name: "Punta Bandera" },
  { slug: "real-del-mar", name: "Real del Mar" },
  { slug: "residencial-del-bosque", name: "Residencial del Bosque" },
  { slug: "san-antonio-del-mar", name: "San Antonio del Mar" },
  { slug: "santa-fe", name: "Santa Fe" },
  { slug: "soler", name: "Mirador-Soler" },
  { slug: "terrazas-de-la-presa", name: "Terrazas de la Presa" },
  { slug: "villa-fontana", name: "Villa Fontana" },
  { slug: "zona-este", name: "Zona Este" },
  { slug: "zona-rio", name: "Zona Río" },
  { slug: "otros", name: "Otros" },
]

// Additional search aliases — short forms and common variations
// Each maps to a zone slug. Only aliases >=4 chars to avoid false positives.
const ZONE_ALIASES: Record<string, string> = {
  // Short forms people commonly use
  "playas": "playas-de-tijuana",
  "zona rio": "zona-rio",
  "rio tijuana": "zona-rio",
  "rio zona": "zona-rio",
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
  "cucapah": "el-lago-cucapah",
  "lago cucapah": "el-lago-cucapah",
  "cerro colorado": "cerro-colorado",
  "el florido": "el-florido",
  "las americas": "las-americas",
  "la mesa": "la-mesa",
  "buena vista": "buena-vista",
  "santa fe": "santa-fe",
  "soler": "soler",
  "mirador": "soler",
  "cacho": "cacho",
  "cumbres": "cacho",
  "hipodromo": "hipodromo",
  "chapultepec": "chapultepec",
  // From Capa 5 — frequent unmatched patterns
  "toreo": "otay",
  "calete": "cacho",
  "valparaiso": "playas-de-tijuana",
  "mariano matamoros": "la-mesa",
  "san marino": "la-mesa",
  "new city": "zona-rio",
  "city center": "zona-rio",
  "the park": "zona-rio",
  "landmark": "zona-rio",
  "presa rodriguez": "terrazas-de-la-presa",
  "presa": "terrazas-de-la-presa",
  "dorada": "agua-caliente",
  "plaza dorada": "agua-caliente",
  "villa del alamo": "hipodromo",
}

// ─── Normalization (mirrors zone-assigner.ts) ──────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Types ─────────────────────────────────────────────────────────

interface ListingRow {
  id: string
  zone_id: string | null
  title: string | null
  description: string | null
  address: string | null
  lat: number | null
  lng: number | null
  source_portal: string
  is_active: boolean
}

interface ZoneRow {
  id: string
  slug: string
  name: string
}

interface TextDetection {
  listing: ListingRow
  titleZones: string[]   // slugs found in title
  descZones: string[]    // slugs found in description
  bestMatch: string | null // best slug (longest zone name match)
  source: "title" | "description" | "both" | "none"
}

// ─── Helpers ───────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  if (total === 0) return "0.0%"
  return (n / total * 100).toFixed(1) + "%"
}

function bar(n: number, total: number, width = 30): string {
  const filled = total > 0 ? Math.round(n / total * width) : 0
  return "█".repeat(filled) + "░".repeat(width - filled)
}

// ─── Data fetching with pagination ─────────────────────────────────

async function fetchAllListings(): Promise<ListingRow[]> {
  const PAGE_SIZE = 1000
  const all: ListingRow[] = []
  let offset = 0

  while (true) {
    let query = supabase
      .from("listings")
      .select("id, zone_id, title, description, address, lat, lng, source_portal, is_active")
      .range(offset, offset + PAGE_SIZE - 1)

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query
    if (error) {
      console.error("Failed to fetch listings:", error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break

    all.push(...(data as ListingRow[]))
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    process.stdout.write(`  Fetched ${all.length} listings...\r`)
  }

  return all
}

async function fetchZones(): Promise<ZoneRow[]> {
  const { data, error } = await supabase.from("zones").select("id, slug, name")
  if (error || !data) {
    console.error("Failed to fetch zones:", error?.message)
    process.exit(1)
  }
  return data as ZoneRow[]
}

// ─── Zone detection in text ────────────────────────────────────────

// Build search terms: normalized zone names + aliases, sorted longest first
function buildSearchTerms(zones: { slug: string; name: string }[]): { term: string; slug: string }[] {
  const terms: { term: string; slug: string }[] = []

  // Zone names (skip "Otros" and "Centro" — too generic for title matching)
  for (const z of zones) {
    if (z.slug === "otros") continue
    const normName = normalize(z.name)
    if (normName.length >= 4) {
      terms.push({ term: normName, slug: z.slug })
    }
    // Also add slug form (with spaces instead of hyphens)
    const normSlug = z.slug.replace(/-/g, " ")
    if (normSlug !== normName && normSlug.length >= 4) {
      terms.push({ term: normSlug, slug: z.slug })
    }
  }

  // Aliases
  for (const [alias, slug] of Object.entries(ZONE_ALIASES)) {
    const normAlias = normalize(alias)
    if (normAlias.length >= 4) {
      terms.push({ term: normAlias, slug })
    }
  }

  // Sort longest first (most specific match wins)
  terms.sort((a, b) => b.term.length - a.term.length)

  // Deduplicate
  const seen = new Set<string>()
  return terms.filter((t) => {
    const key = t.term + "|" + t.slug
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Simple containment match (original method) */
function detectZonesSimple(
  text: string | null,
  searchTerms: { term: string; slug: string }[],
): string[] {
  if (!text) return []
  const normText = normalize(text)
  if (!normText) return []

  const found = new Set<string>()
  for (const { term, slug } of searchTerms) {
    if (normText.includes(term)) {
      found.add(slug)
    }
  }
  return Array.from(found)
}

/** Word-boundary match — term must be surrounded by spaces or string edges */
function detectZonesStrict(
  text: string | null,
  searchTerms: { term: string; slug: string }[],
): string[] {
  if (!text) return []
  const normText = " " + normalize(text) + " " // pad for boundary matching
  if (normText.trim().length === 0) return []

  const found = new Set<string>()
  for (const { term, slug } of searchTerms) {
    // Check word boundaries: space/start before, space/end/comma after
    const idx = normText.indexOf(term)
    if (idx === -1) continue

    const charBefore = normText[idx - 1]
    const charAfter = normText[idx + term.length]

    const validBefore = charBefore === " " || charBefore === undefined
    const validAfter = charAfter === " " || charAfter === undefined

    if (validBefore && validAfter) {
      found.add(slug)
    }
  }
  return Array.from(found)
}

// ─── Analysis ──────────────────────────────────────────────────────

interface AnalysisResult {
  label: string
  detections: TextDetection[]
}

function runAnalysis(
  listings: ListingRow[],
  dbZones: ZoneRow[],
  detectFn: typeof detectZonesSimple,
  useDesc: boolean,
  label: string,
): AnalysisResult {
  const searchTerms = buildSearchTerms(ZONES)

  const detections = listings.map((l) => {
    const titleZones = detectFn(l.title, searchTerms)
    const descZones = useDesc ? detectFn(l.description, searchTerms) : []

    let bestMatch: string | null = null
    if (titleZones.length > 0) {
      bestMatch = titleZones[0]
    } else if (descZones.length > 0) {
      bestMatch = descZones[0]
    }

    const source: TextDetection["source"] =
      titleZones.length > 0 && descZones.length > 0 ? "both" :
      titleZones.length > 0 ? "title" :
      descZones.length > 0 ? "description" :
      "none"

    return { listing: l, titleZones, descZones, bestMatch, source }
  })

  return { label, detections }
}

// ─── Compact stats for comparison table ────────────────────────────

function getStats(detections: TextDetection[], dbZones: ZoneRow[]) {
  const total = detections.length
  const zoneIdToSlug = new Map(dbZones.map((z) => [z.id, z.slug]))
  const otrosZone = dbZones.find((z) => z.slug === "otros")
  const otrosId = otrosZone?.id ?? null

  const withZone = detections.filter((d) => d.bestMatch !== null)
  const withTitleZone = detections.filter((d) => d.titleZones.length > 0)
  const multiZone = detections.filter((d) => new Set([...d.titleZones, ...d.descZones]).size > 1)

  const assigned = detections.filter((d) => d.listing.zone_id && d.listing.zone_id !== otrosId)
  const otros = detections.filter((d) => !d.listing.zone_id || d.listing.zone_id === otrosId)

  const assignedWithText = assigned.filter((d) => d.bestMatch !== null)
  let agree = 0, disagree = 0
  const disagreements: { title: string; current: string; detected: string }[] = []

  for (const d of assignedWithText) {
    const currentSlug = zoneIdToSlug.get(d.listing.zone_id!) ?? "?"
    if (d.bestMatch === currentSlug) {
      agree++
    } else {
      disagree++
      if (disagreements.length < 30) {
        const zoneSlugToName = new Map(ZONES.map((z) => [z.slug, z.name]))
        disagreements.push({
          title: (d.listing.title ?? "").slice(0, 70),
          current: zoneSlugToName.get(currentSlug) ?? currentSlug,
          detected: zoneSlugToName.get(d.bestMatch!) ?? d.bestMatch!,
        })
      }
    }
  }

  const otrosRescuable = otros.filter((d) => d.bestMatch !== null)

  return {
    total,
    coverage: withZone.length,
    coverageTitleOnly: withTitleZone.length,
    multiZone: multiZone.length,
    assigned: assigned.length,
    assignedWithText: assignedWithText.length,
    agree,
    disagree,
    disagreements,
    otros: otros.length,
    otrosRescuable: otrosRescuable.length,
  }
}

// ─── Report ────────────────────────────────────────────────────────

function printComparativeReport(analyses: AnalysisResult[], dbZones: ZoneRow[]) {
  const listings = analyses[0].detections.map((d) => d.listing)
  const total = listings.length
  const zoneSlugToName = new Map(ZONES.map((z) => [z.slug, z.name]))
  const otrosZone = dbZones.find((z) => z.slug === "otros")
  const otrosId = otrosZone?.id ?? null

  console.log("\n" + "═".repeat(80))
  console.log("  ANALISIS DE VIABILIDAD — Clasificacion de zonas por texto (v2)")
  console.log("═".repeat(80))
  console.log(`  ${total} listings analizados ${activeOnly ? "(solo activos)" : "(todos)"}\n`)

  // ─── CAPA 1: Disponibilidad de datos ──────────────────────────

  console.log("─".repeat(80))
  console.log("  CAPA 1: Disponibilidad de datos")
  console.log("─".repeat(80))

  const withTitle = listings.filter((l) => l.title && l.title.trim().length > 0)
  const withDesc = listings.filter((l) => l.description && l.description.trim().length > 0)
  const withAddress = listings.filter((l) => l.address && l.address.trim().length > 0)
  const withCoords = listings.filter((l) => l.lat !== null && l.lng !== null)
  const active = listings.filter((l) => l.is_active)

  console.log(`\n  Activos:      ${active.length.toLocaleString()} / ${total.toLocaleString()}  ${pct(active.length, total)}`)
  console.log(`  Con titulo:   ${withTitle.length.toLocaleString()} / ${total.toLocaleString()}  ${pct(withTitle.length, total)}  ${bar(withTitle.length, total)}`)
  console.log(`  Con descrip:  ${withDesc.length.toLocaleString()} / ${total.toLocaleString()}  ${pct(withDesc.length, total)}  ${bar(withDesc.length, total)}`)
  console.log(`  Con address:  ${withAddress.length.toLocaleString()} / ${total.toLocaleString()}  ${pct(withAddress.length, total)}  ${bar(withAddress.length, total)}`)
  console.log(`  Con lat/lng:  ${withCoords.length.toLocaleString()} / ${total.toLocaleString()}  ${pct(withCoords.length, total)}  ${bar(withCoords.length, total)}`)

  // ─── CAPA 2: TABLA COMPARATIVA ──────────────────────────────

  console.log("\n" + "─".repeat(80))
  console.log("  CAPA 2: TABLA COMPARATIVA — todas las estrategias")
  console.log("─".repeat(80))

  const allStats = analyses.map((a) => ({
    label: a.label,
    ...getStats(a.detections, dbZones),
  }))

  // Header
  const COL_W = 18
  console.log(`\n  ${"Metrica".padEnd(32)} ${allStats.map((s) => s.label.padStart(COL_W)).join("")}`)
  console.log("  " + "─".repeat(32 + allStats.length * COL_W))

  // Rows
  const rows = [
    { label: "Cobertura (zona detectada)", key: "coverage" },
    { label: "  % cobertura", key: "coveragePct" },
    { label: "Zonas multiples detectadas", key: "multiZone" },
    { label: "  % multi-zona", key: "multiZonePct" },
    { label: "Acuerdo (texto=zona actual)", key: "agree" },
    { label: "  % acuerdo", key: "agreePct" },
    { label: "Desacuerdo", key: "disagree" },
    { label: "  % desacuerdo", key: "disagreePct" },
    { label: "Rescatables de Otros", key: "otrosRescuable" },
    { label: "  % rescate Otros", key: "otrosRescuePct" },
  ]

  for (const row of rows) {
    const vals = allStats.map((s) => {
      switch (row.key) {
        case "coverage": return String(s.coverage)
        case "coveragePct": return pct(s.coverage, s.total)
        case "multiZone": return String(s.multiZone)
        case "multiZonePct": return pct(s.multiZone, s.total)
        case "agree": return String(s.agree)
        case "agreePct": return pct(s.agree, s.assignedWithText || 1)
        case "disagree": return String(s.disagree)
        case "disagreePct": return pct(s.disagree, s.assignedWithText || 1)
        case "otrosRescuable": return String(s.otrosRescuable)
        case "otrosRescuePct": return pct(s.otrosRescuable, s.otros || 1)
        default: return "?"
      }
    })
    console.log(`  ${row.label.padEnd(32)} ${vals.map((v) => v.padStart(COL_W)).join("")}`)
  }

  // ─── CAPA 3: Detalle de la MEJOR estrategia (titulo strict) ──

  // Pick the strategy with best agreement rate
  const bestIdx = allStats.reduce((best, s, i) =>
    s.assignedWithText > 0 && (s.agree / s.assignedWithText) > (allStats[best].agree / (allStats[best].assignedWithText || 1)) ? i : best
  , 0)
  const best = analyses[bestIdx]
  const bestStats = allStats[bestIdx]

  console.log(`\n` + "─".repeat(80))
  console.log(`  CAPA 3: Detalle de mejor estrategia → "${best.label}"`)
  console.log("─".repeat(80))

  // Zone frequency ranking for best strategy
  const zoneFreq = new Map<string, number>()
  for (const d of best.detections) {
    if (d.bestMatch) {
      zoneFreq.set(d.bestMatch, (zoneFreq.get(d.bestMatch) ?? 0) + 1)
    }
  }

  const ranked = Array.from(zoneFreq.entries()).sort((a, b) => b[1] - a[1])
  console.log("\n  Top zonas detectadas:")
  for (const [slug, count] of ranked.slice(0, 20)) {
    const name = zoneSlugToName.get(slug) ?? slug
    console.log(`    ${name.padEnd(30)} ${String(count).padStart(5)}  ${pct(count, total).padStart(6)}  ${bar(count, total, 20)}`)
  }

  // Disagreement examples for best strategy
  if (bestStats.disagreements.length > 0) {
    console.log(`\n  Ejemplos de desacuerdo (${bestStats.disagree} total):`)
    for (const d of bestStats.disagreements.slice(0, 15)) {
      console.log(`    "${d.title}"`)
      console.log(`      Actual: ${d.current}  |  Texto dice: ${d.detected}`)
    }
  }

  // Otros rescue for best strategy
  const otrosDetections = best.detections.filter((d) => !d.listing.zone_id || d.listing.zone_id === otrosId)
  const otrosWithText = otrosDetections.filter((d) => d.bestMatch !== null)
  if (otrosWithText.length > 0) {
    const rescueByZone = new Map<string, number>()
    for (const d of otrosWithText) {
      rescueByZone.set(d.bestMatch!, (rescueByZone.get(d.bestMatch!) ?? 0) + 1)
    }
    console.log(`\n  Rescatables de "Otros" (${otrosWithText.length}/${otrosDetections.length}):`)
    for (const [slug, count] of Array.from(rescueByZone.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      const name = zoneSlugToName.get(slug) ?? slug
      console.log(`    ${name.padEnd(30)} ${String(count).padStart(4)}`)
    }
  }

  // ─── CAPA 4: Patrones no matcheados de la mejor ──────────────

  console.log("\n" + "─".repeat(80))
  console.log("  CAPA 4: Patrones no matcheados (potenciales aliases)")
  console.log("─".repeat(80))

  const noMatch = best.detections.filter((d) => d.bestMatch === null && d.listing.title)

  const TITLE_NOISE = new Set([
    "en", "de", "del", "la", "el", "los", "las", "con", "sin", "para", "por",
    "venta", "renta", "casa", "departamento", "depto", "terreno", "local", "oficina",
    "recamaras", "banos", "estacionamiento", "estacionamientos", "cochera",
    "nuevo", "nueva", "nuevos", "nuevas", "hermosa", "hermoso", "amplia", "amplio",
    "excelente", "ubicacion", "oportunidad", "inversion", "inversionistas",
    "tijuana", "baja", "california", "mexico", "bc",
    "m2", "mts", "metros", "cuadrados", "sup", "superficie",
    "planta", "alta", "nivel", "piso", "pisos",
    "hab", "habitaciones", "recamara", "bano",
    "sala", "comedor", "cocina", "garage", "jardin", "patio",
    "residencial", "fraccionamiento", "privada", "condominio", "condo",
    "pre", "preventa", "proyecto",
    "zona", "col", "colonia",
  ])

  const phraseFreq = new Map<string, number>()
  for (const d of noMatch) {
    const normTitle = normalize(d.listing.title!)
    const words = normTitle.split(" ").filter((w) => w.length >= 3 && !TITLE_NOISE.has(w))

    for (const w of words) {
      if (w.length >= 4 && !w.match(/^\d+$/)) {
        phraseFreq.set(w, (phraseFreq.get(w) ?? 0) + 1)
      }
    }
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + " " + words[i + 1]
      if (bigram.length >= 6) {
        phraseFreq.set(bigram, (phraseFreq.get(bigram) ?? 0) + 1)
      }
    }
  }

  const frequentPhrases = Array.from(phraseFreq.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])

  console.log(`\n  ${noMatch.length} listings sin zona detectada`)
  console.log(`\n  Frases frecuentes sin match (3+ veces):`)
  for (const [phrase, count] of frequentPhrases.slice(0, 30)) {
    console.log(`    ${phrase.padEnd(35)} ${String(count).padStart(4)}`)
  }

  // ─── CAPA 5: Detalle IA vs Script (misma muestra) ─────────────

  const aiAnalysis = analyses.find((a) => a.label.startsWith("IA"))
  const scriptSample = analyses.find((a) => a.label.includes("n=50") && !a.label.startsWith("IA"))

  if (aiAnalysis && scriptSample) {
    const zoneIdToSlug = new Map(dbZones.map((z) => [z.id, z.slug]))

    console.log("\n" + "─".repeat(80))
    console.log("  CAPA 5: IA vs Script — misma muestra de 50 listings")
    console.log("─".repeat(80))

    console.log("\n  Caso por caso (primeros 30):\n")
    console.log(`  ${"#".padEnd(4)} ${"Titulo".padEnd(50)} ${"Actual".padEnd(20)} ${"Script".padEnd(20)} ${"IA".padEnd(20)} ${"Mejor"}`)
    console.log("  " + "─".repeat(134))

    const aiDets = aiAnalysis.detections
    const scriptDets = scriptSample.detections

    let aiWins = 0, scriptWins = 0, tie = 0

    for (let i = 0; i < Math.min(aiDets.length, scriptDets.length); i++) {
      const ai = aiDets[i]
      const scr = scriptDets[i]
      const currentSlug = zoneIdToSlug.get(ai.listing.zone_id ?? "") ?? "otros"
      const aiSlug = ai.bestMatch ?? "otros"
      const scrSlug = scr.bestMatch ?? "—"
      const aiMatch = aiSlug === currentSlug
      const scrMatch = scrSlug === currentSlug

      if (aiMatch && !scrMatch) aiWins++
      else if (!aiMatch && scrMatch) scriptWins++
      else tie++

      const winner = aiMatch && !scrMatch ? "IA" : !aiMatch && scrMatch ? "Script" : aiMatch && scrMatch ? "=" : "ninguno"

      if (i < 30) {
        const title = (ai.listing.title ?? "").slice(0, 48)
        const actualName = zoneSlugToName.get(currentSlug) ?? currentSlug
        const aiName = zoneSlugToName.get(aiSlug) ?? aiSlug
        const scrName = scrSlug === "—" ? "—" : (zoneSlugToName.get(scrSlug) ?? scrSlug)

        const aiFlag = aiMatch ? "✓" : "✗"
        const scrFlag = scrMatch ? "✓" : "✗"

        console.log(`  ${String(i + 1).padEnd(4)} ${title.padEnd(50)} ${actualName.padEnd(20)} ${(scrFlag + " " + scrName).padEnd(20)} ${(aiFlag + " " + aiName).padEnd(20)} ${winner}`)
      }
    }

    console.log("\n  " + "─".repeat(60))
    console.log(`  IA gana:     ${aiWins}  (${pct(aiWins, aiDets.length)})`)
    console.log(`  Script gana: ${scriptWins}  (${pct(scriptWins, aiDets.length)})`)
    console.log(`  Empate:      ${tie}  (${pct(tie, aiDets.length)})`)
  }

  // ─── RESUMEN ─────────────────────────────────────────────────

  console.log("\n" + "═".repeat(80))
  console.log("  RESUMEN COMPARATIVO")
  console.log("═".repeat(80))

  for (const s of allStats) {
    const agreePct = s.assignedWithText > 0 ? (s.agree / s.assignedWithText * 100).toFixed(1) : "N/A"
    const coverPct = (s.coverage / s.total * 100).toFixed(1)
    const multiPct = (s.multiZone / s.total * 100).toFixed(1)
    console.log(`\n  ${s.label}:`)
    console.log(`    Cobertura: ${coverPct}%  |  Acuerdo: ${agreePct}%  |  Multi-zona: ${multiPct}%  |  Rescate Otros: ${s.otrosRescuable}/${s.otros}`)
  }

  console.log("\n" + "═".repeat(80) + "\n")
}

// ─── AI classification (Claude Haiku) ──────────────────────────────

const ZONE_LIST_FOR_PROMPT = ZONES
  .filter((z) => z.slug !== "otros")
  .map((z) => `${z.slug}: ${z.name}`)
  .join("\n")

const SYSTEM_PROMPT = `Eres un experto en el mercado inmobiliario de Tijuana, México. Tu tarea es clasificar propiedades inmobiliarias en una de las siguientes zonas de Tijuana basándote en el título y descripción del anuncio.

ZONAS DISPONIBLES:
${ZONE_LIST_FOR_PROMPT}
otros: Ninguna de las anteriores / no se puede determinar

REGLAS:
- Responde SOLO con un JSON array. Nada más.
- Cada elemento: {"idx": <número>, "slug": "<zone-slug>", "confianza": "alta"|"media"|"baja"}
- Si el título menciona explícitamente una zona o colonia conocida, usa esa zona con confianza "alta"
- Si la zona se infiere por el nombre del desarrollo o referencia geográfica, usa confianza "media"
- Si no puedes determinar la zona, usa slug "otros" con confianza "baja"
- "Agua Caliente" y "Lomas de Agua Caliente" son zonas DIFERENTES
- "Hipódromo" e "Hipódromo-Chapultepec" son zonas DIFERENTES
- Nombres como "Valparaiso", "La Rioja" son desarrollos en Santa Fe, NO en Playas
- "Zona Dorada" está en la zona de Agua Caliente
- "City Center", "The Park", "New City", "Landmark" son desarrollos en Zona Río
- "Mariano Matamoros" está en La Mesa
- "Presa" o "Presa Rodríguez" → Terrazas de la Presa`

async function classifyWithAI(batch: { idx: number; title: string; description: string }[]): Promise<{ idx: number; slug: string; confianza: string }[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set")

  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const client = new Anthropic({ apiKey })

  const listingsText = batch.map((b) => {
    const desc = b.description ? b.description.slice(0, 200) : "(sin descripción)"
    return `[${b.idx}] Título: ${b.title}\n    Descripción: ${desc}`
  }).join("\n\n")

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Clasifica estas ${batch.length} propiedades:\n\n${listingsText}` }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : "[]"

  // Extract JSON from response (might be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return batch.map((b) => ({ idx: b.idx, slug: "otros", confianza: "baja" }))

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return batch.map((b) => ({ idx: b.idx, slug: "otros", confianza: "baja" }))
  }
}

/** Select a stratified sample: some script-correct, some script-wrong, some "otros" */
function selectSample(
  detections: TextDetection[],
  dbZones: ZoneRow[],
  sampleSize: number,
): TextDetection[] {
  const zoneIdToSlug = new Map(dbZones.map((z) => [z.id, z.slug]))
  const otrosZone = dbZones.find((z) => z.slug === "otros")
  const otrosId = otrosZone?.id ?? null

  const scriptCorrect: TextDetection[] = []
  const scriptWrong: TextDetection[] = []
  const inOtros: TextDetection[] = []

  for (const d of detections) {
    const isOtros = !d.listing.zone_id || d.listing.zone_id === otrosId
    if (isOtros) {
      inOtros.push(d)
    } else if (d.bestMatch) {
      const currentSlug = zoneIdToSlug.get(d.listing.zone_id!) ?? "?"
      if (d.bestMatch === currentSlug) scriptCorrect.push(d)
      else scriptWrong.push(d)
    } else {
      // Script couldn't classify, but has a zone — treat as "wrong" for sampling
      scriptWrong.push(d)
    }
  }

  // Shuffle arrays
  const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5)
  shuffle(scriptCorrect)
  shuffle(scriptWrong)
  shuffle(inOtros)

  const third = Math.ceil(sampleSize / 3)
  return [
    ...scriptCorrect.slice(0, third),
    ...scriptWrong.slice(0, third),
    ...inOtros.slice(0, sampleSize - 2 * third),
  ]
}

async function runAIAnalysis(
  sample: TextDetection[],
  dbZones: ZoneRow[],
): Promise<AnalysisResult> {
  const BATCH_SIZE = 10
  const allResults: { idx: number; slug: string; confianza: string }[] = []

  for (let i = 0; i < sample.length; i += BATCH_SIZE) {
    const batch = sample.slice(i, i + BATCH_SIZE).map((d, j) => ({
      idx: i + j,
      title: d.listing.title ?? "",
      description: d.listing.description ?? "",
    }))

    process.stdout.write(`  IA procesando batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sample.length / BATCH_SIZE)}...\r`)
    const results = await classifyWithAI(batch)
    allResults.push(...results)
  }
  console.log()

  // Build TextDetection[] from AI results
  const detections: TextDetection[] = sample.map((d, i) => {
    const aiResult = allResults.find((r) => r.idx === i)
    const slug = aiResult?.slug ?? "otros"
    const validSlug = ZONES.some((z) => z.slug === slug) ? slug : "otros"

    return {
      listing: d.listing,
      titleZones: validSlug !== "otros" ? [validSlug] : [],
      descZones: [],
      bestMatch: validSlug !== "otros" ? validSlug : null,
      source: validSlug !== "otros" ? "title" as const : "none" as const,
    }
  })

  return { label: "IA Haiku (n=50)", detections }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍 Analisis de viabilidad: clasificacion de zonas por texto (v2 + IA)\n")
  console.log("Cargando datos de Supabase...")

  const [listings, dbZones] = await Promise.all([
    fetchAllListings(),
    fetchZones(),
  ])

  console.log(`  ${listings.length} listings cargados`)
  console.log(`  ${dbZones.length} zonas en base de datos`)
  console.log(`  Corriendo 4 estrategias de texto...\n`)

  // Run 4 text strategies
  const analyses: AnalysisResult[] = [
    runAnalysis(listings, dbZones, detectZonesSimple, false, "Titulo simple"),
    runAnalysis(listings, dbZones, detectZonesStrict, false, "Titulo strict"),
    runAnalysis(listings, dbZones, detectZonesSimple, true,  "T+D simple"),
    runAnalysis(listings, dbZones, detectZonesStrict, true,  "T+D strict"),
  ]

  // Run AI strategy on sample of 50
  console.log("  Seleccionando muestra de 50 para IA...")
  const titleStrict = analyses[1] // "Titulo strict" as reference for sampling
  const sample = selectSample(titleStrict.detections, dbZones, 50)
  console.log(`  Muestra: ${sample.length} listings (script ok + script mal + otros)`)
  console.log("  Enviando a Claude Haiku...\n")

  const aiAnalysis = await runAIAnalysis(sample, dbZones)
  analyses.push(aiAnalysis)

  // Also run titulo strict on the SAME sample for fair comparison
  const sampleListings = sample.map((d) => d.listing)
  const titleStrictSample = runAnalysis(sampleListings, dbZones, detectZonesStrict, false, "Titulo strict (n=50)")
  analyses.push(titleStrictSample)

  printComparativeReport(analyses, dbZones)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
