#!/usr/bin/env node
/**
 * Hybrid zone reclassification — Script + AI + coordinate cross-validation.
 *
 * Strategy:
 * 1. Title strict match (free, deterministic) → confidence "alta"
 * 2. AI fallback for unmatched (Claude Haiku) → confidence from AI
 * 3. Coordinate cross-validation → upgrade/downgrade AI confidence
 *
 * Modes:
 *   npx tsx scripts/reclassify-zones.ts              # Dry run — preview only
 *   npx tsx scripts/reclassify-zones.ts --apply       # Apply changes to DB
 *   npx tsx scripts/reclassify-zones.ts --apply=alta  # Only apply "alta" confidence
 *   npx tsx scripts/reclassify-zones.ts --apply=media # Apply "alta" + "media"
 */

import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import {
  matchTitleStrict,
  classifyBatchWithAI,
  crossValidateWithCoords,
  type HybridResult,
} from "../src/scraper/ai-zone-classifier";

const CACHE_PATH = path.resolve(process.cwd(), "tmp/reclassify-cache.json");
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

// ─── Setup ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const applyArg = args.find((a) => a.startsWith("--apply"));
const applyMode = applyArg
  ? applyArg.includes("=") ? applyArg.split("=")[1] : "all"
  : null;
const verbose = args.includes("--verbose");
const noCache = args.includes("--no-cache");

// ─── Cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  timestamp: number;
  aiResults: Record<string, { slug: string; confianza: "alta" | "media" | "baja" }>;
}

function loadCache(): CacheEntry | null {
  if (noCache) return null;
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as CacheEntry;
    if (Date.now() - raw.timestamp > CACHE_MAX_AGE_MS) {
      console.log("  Cache expirado (>1 hora), se re-clasificará.\n");
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function saveCache(aiResults: Map<string, { slug: string; confianza: "alta" | "media" | "baja" }>) {
  const entry: CacheEntry = {
    timestamp: Date.now(),
    aiResults: Object.fromEntries(aiResults),
  };
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(entry, null, 2));
  console.log(`  Cache guardado en ${CACHE_PATH}\n`);
}

// ─── Types ─────────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  zone_id: string | null;
  title: string | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
}

interface ZoneRow {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

interface ClassificationResult {
  listing: ListingRow;
  currentSlug: string;
  newSlug: string;
  method: HybridResult["method"];
  confidence: "alta" | "media" | "baja";
  changed: boolean;
}

// ─── Data fetching ─────────────────────────────────────────────────

async function fetchAllListings(): Promise<ListingRow[]> {
  const PAGE_SIZE = 1000;
  const all: ListingRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, zone_id, title, description, address, lat, lng, is_active")
      .eq("is_active", true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...(data as ListingRow[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function fetchZones(): Promise<ZoneRow[]> {
  const { data, error } = await supabase.from("zones").select("id, slug, name, lat, lng");
  if (error || !data) { console.error("Zones error:", error?.message); process.exit(1); }
  return data as ZoneRow[];
}

// ─── Helpers ───────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  return total > 0 ? (n / total * 100).toFixed(1) + "%" : "0%";
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄 Reclasificacion de zonas — Modo hibrido (Script + IA + Coords)\n");

  if (applyMode) {
    const minConf = applyMode === "alta" ? "alta" : applyMode === "media" ? "media" : "all";
    console.log(`  Modo: APLICAR cambios (confianza minima: ${minConf})`);
  } else {
    console.log("  Modo: DRY RUN (solo preview, usa --apply para aplicar)");
  }

  const [listings, zones] = await Promise.all([fetchAllListings(), fetchZones()]);
  const zoneIdToSlug = new Map(zones.map((z) => [z.id, z.slug]));
  const zoneSlugToId = new Map(zones.map((z) => [z.slug, z.id]));
  const zoneSlugToName = new Map(zones.map((z) => [z.slug, z.name]));
  const otrosId = zoneSlugToId.get("otros") ?? null;

  console.log(`  ${listings.length} listings activos | ${zones.length} zonas\n`);

  // ─── Step 1: Title strict matching ──────────────────────────────

  console.log("  Paso 1: Title strict matching...");

  const scriptMatched: ListingRow[] = [];
  const scriptUnmatched: ListingRow[] = [];
  const scriptResults = new Map<string, { slug: string }>();

  for (const l of listings) {
    const slug = matchTitleStrict(l.title, zones);
    if (slug) {
      scriptMatched.push(l);
      scriptResults.set(l.id, { slug });
    } else {
      scriptUnmatched.push(l);
    }
  }

  console.log(`    Matcheados: ${scriptMatched.length} (${pct(scriptMatched.length, listings.length)})`);
  console.log(`    Sin match:  ${scriptUnmatched.length} → enviando a IA\n`);

  // ─── Step 2: AI classification for unmatched (with cache) ────────

  const aiResults = new Map<string, { slug: string; confianza: "alta" | "media" | "baja" }>();
  const cached = loadCache();

  if (cached) {
    console.log("  Paso 2: Leyendo resultados de IA del cache...");
    for (const [id, val] of Object.entries(cached.aiResults)) {
      aiResults.set(id, val);
    }
    console.log(`    ${aiResults.size} resultados cargados del cache\n`);
  } else {
    console.log("  Paso 2: Clasificacion con IA (Claude Haiku)...");

    const BATCH_SIZE = 10;

    for (let i = 0; i < scriptUnmatched.length; i += BATCH_SIZE) {
      const batch = scriptUnmatched.slice(i, i + BATCH_SIZE);
      const batchInput = batch.map((l, j) => ({
        idx: j,
        title: l.title ?? "(sin título)",
        description: l.description ?? "",
        address: l.address ?? "",
      }));

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(scriptUnmatched.length / BATCH_SIZE);
      process.stdout.write(`    Batch ${batchNum}/${totalBatches}...\r`);

      const results = await classifyBatchWithAI(batchInput, zones);

      for (let j = 0; j < batch.length; j++) {
        const r = results[j] ?? { slug: "otros", confianza: "baja" as const };
        aiResults.set(batch[j].id, { slug: r.slug, confianza: r.confianza });
      }
    }

    console.log(`    ${aiResults.size} listings clasificados por IA`);
    saveCache(aiResults);
  }

  // ─── Step 3: Coordinate cross-validation + compile results ──────

  console.log("  Paso 3: Cross-validacion con coordenadas...\n");

  const results: ClassificationResult[] = [];

  for (const l of listings) {
    const currentSlug = zoneIdToSlug.get(l.zone_id ?? "") ?? "otros";

    // Script matched?
    const scriptResult = scriptResults.get(l.id);
    if (scriptResult) {
      results.push({
        listing: l,
        currentSlug,
        newSlug: scriptResult.slug,
        method: "title-strict",
        confidence: "alta",
        changed: scriptResult.slug !== currentSlug,
      });
      continue;
    }

    // AI result
    const aiResult = aiResults.get(l.id);
    if (aiResult && aiResult.slug !== "otros") {
      const { confidence, method } = crossValidateWithCoords(
        aiResult.slug, aiResult.confianza, l.lat, l.lng, zones,
      );
      results.push({
        listing: l,
        currentSlug,
        newSlug: aiResult.slug,
        method,
        confidence,
        changed: aiResult.slug !== currentSlug,
      });
      continue;
    }

    // No match
    results.push({
      listing: l,
      currentSlug,
      newSlug: "otros",
      method: "none",
      confidence: "baja",
      changed: currentSlug !== "otros",
    });
  }

  // ─── Report ─────────────────────────────────────────────────────

  const total = results.length;
  const byMethod = { "title-strict": 0, ai: 0, "ai+coords": 0, none: 0 };
  const byConf = { alta: 0, media: 0, baja: 0 };
  const changes = results.filter((r) => r.changed);
  const changesAlta = changes.filter((r) => r.confidence === "alta");
  const changesMed = changes.filter((r) => r.confidence === "media");
  const changesBaja = changes.filter((r) => r.confidence === "baja");

  for (const r of results) {
    byMethod[r.method]++;
    byConf[r.confidence]++;
  }

  console.log("═".repeat(80));
  console.log("  RESULTADOS DE CLASIFICACION HIBRIDA");
  console.log("═".repeat(80));

  console.log(`\n  Total listings: ${total}`);
  console.log(`\n  Por metodo:`);
  console.log(`    Title strict:    ${byMethod["title-strict"]}  (${pct(byMethod["title-strict"], total)})`);
  console.log(`    IA:              ${byMethod.ai}  (${pct(byMethod.ai, total)})`);
  console.log(`    IA + coords:     ${byMethod["ai+coords"]}  (${pct(byMethod["ai+coords"], total)})`);
  console.log(`    Sin match:       ${byMethod.none}  (${pct(byMethod.none, total)})`);

  console.log(`\n  Por confianza:`);
  console.log(`    Alta:   ${byConf.alta}  (${pct(byConf.alta, total)})`);
  console.log(`    Media:  ${byConf.media}  (${pct(byConf.media, total)})`);
  console.log(`    Baja:   ${byConf.baja}  (${pct(byConf.baja, total)})`);

  console.log(`\n  Cambios propuestos: ${changes.length} listings cambiarian de zona`);
  console.log(`    Alta confianza:  ${changesAlta.length}`);
  console.log(`    Media confianza: ${changesMed.length}`);
  console.log(`    Baja confianza:  ${changesBaja.length}`);

  // Show changes grouped by type
  if (changes.length > 0) {
    // From "Otros" to a zone
    const fromOtros = changes.filter((r) => r.currentSlug === "otros" && r.newSlug !== "otros");
    const betweenZones = changes.filter((r) => r.currentSlug !== "otros" && r.newSlug !== "otros" && r.changed);
    const toOtros = changes.filter((r) => r.currentSlug !== "otros" && r.newSlug === "otros");

    if (fromOtros.length > 0) {
      console.log(`\n  ─── Rescatados de "Otros" (${fromOtros.length}) ───`);
      for (const r of fromOtros.slice(0, 20)) {
        const name = zoneSlugToName.get(r.newSlug) ?? r.newSlug;
        const conf = r.confidence === "alta" ? "✓✓" : r.confidence === "media" ? "✓" : "?";
        const title = (r.listing.title ?? "").slice(0, 55);
        console.log(`    ${conf} → ${name.padEnd(25)} "${title}" [${r.method}]`);
      }
      if (fromOtros.length > 20) console.log(`    ... y ${fromOtros.length - 20} más`);
    }

    if (betweenZones.length > 0) {
      console.log(`\n  ─── Reasignados entre zonas (${betweenZones.length}) ───`);
      for (const r of betweenZones.slice(0, 20)) {
        const from = zoneSlugToName.get(r.currentSlug) ?? r.currentSlug;
        const to = zoneSlugToName.get(r.newSlug) ?? r.newSlug;
        const conf = r.confidence === "alta" ? "✓✓" : r.confidence === "media" ? "✓" : "?";
        const title = (r.listing.title ?? "").slice(0, 40);
        console.log(`    ${conf} ${from.padEnd(22)} → ${to.padEnd(22)} "${title}" [${r.method}]`);
      }
      if (betweenZones.length > 20) console.log(`    ... y ${betweenZones.length - 20} más`);
    }

    if (toOtros.length > 0) {
      console.log(`\n  ─── Movidos a "Otros" (${toOtros.length}) ───`);
      for (const r of toOtros.slice(0, 10)) {
        const from = zoneSlugToName.get(r.currentSlug) ?? r.currentSlug;
        const title = (r.listing.title ?? "").slice(0, 50);
        console.log(`    ${from.padEnd(25)} → Otros  "${title}" [${r.method}]`);
      }
    }
  }

  // ─── Apply changes ────────────────────────────────────────────

  if (!applyMode) {
    console.log(`\n  Para aplicar cambios:`);
    console.log(`    npx tsx scripts/reclassify-zones.ts --apply        # todos`);
    console.log(`    npx tsx scripts/reclassify-zones.ts --apply=alta   # solo alta confianza`);
    console.log(`    npx tsx scripts/reclassify-zones.ts --apply=media  # alta + media\n`);
    console.log("═".repeat(80) + "\n");
    return;
  }

  // Filter changes by confidence threshold
  const minConfLevels: Record<string, Set<string>> = {
    alta: new Set(["alta"]),
    media: new Set(["alta", "media"]),
    all: new Set(["alta", "media", "baja"]),
  };

  const allowedConf = minConfLevels[applyMode] ?? minConfLevels.all;
  const toApply = changes.filter((r) => allowedConf.has(r.confidence));

  if (toApply.length === 0) {
    console.log("\n  No hay cambios que aplicar con esa confianza.\n");
    return;
  }

  console.log(`\n  Aplicando ${toApply.length} cambios (confianza: ${applyMode})...\n`);

  let applied = 0;
  let errors = 0;

  for (const r of toApply) {
    const newZoneId = zoneSlugToId.get(r.newSlug);
    if (!newZoneId) { errors++; continue; }

    const { error } = await supabase
      .from("listings")
      .update({ zone_id: newZoneId })
      .eq("id", r.listing.id);

    if (error) {
      errors++;
      if (verbose) console.error(`    Error updating ${r.listing.id}: ${error.message}`);
    } else {
      applied++;
    }
  }

  console.log(`  Aplicados: ${applied} | Errores: ${errors}`);
  console.log("\n═".repeat(80) + "\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
