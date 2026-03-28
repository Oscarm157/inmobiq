#!/usr/bin/env node
/**
 * Zone Health Report — geographic consistency check.
 *
 * For each zone, checks how far its listings are from the zone centroid.
 * Flags listings that are suspiciously far away.
 *
 * Usage:
 *   npx tsx scripts/zone-health.ts
 *   npx tsx scripts/zone-health.ts --zone=libertad
 */

import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const zoneFilter = process.argv.find((a) => a.startsWith("--zone="))?.split("=")[1];

// ─── Helpers ───────────────────────────────────────────────────────

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

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pct(n: number, total: number): string {
  return total > 0 ? (n / total * 100).toFixed(0) + "%" : "—";
}

function bar(n: number, total: number, w = 20): string {
  const f = total > 0 ? Math.round(n / total * w) : 0;
  return "█".repeat(f) + "░".repeat(w - f);
}

// ─── Types ─────────────────────────────────────────────────────────

interface Zone { id: string; slug: string; name: string; lat: number; lng: number; }
interface Listing { id: string; zone_id: string; title: string | null; lat: number | null; lng: number | null; address: string | null; }

interface ZoneHealth {
  zone: Zone;
  total: number;
  withCoords: number;
  noCoords: number;
  distances: number[];
  medianDist: number;
  within1km: number;
  within2km: number;
  beyond3km: number;
  beyond5km: number;
  suspicious: { listing: Listing; dist: number }[];
}

// ─── Data ──────────────────────────────────────────────────────────

async function fetchAll() {
  const { data: zones } = await supabase.from("zones").select("id, slug, name, lat, lng");
  if (!zones) { console.error("No zones"); process.exit(1); }

  const PAGE_SIZE = 1000;
  const listings: Listing[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("listings")
      .select("id, zone_id, title, lat, lng, address")
      .eq("is_active", true)
      .range(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    listings.push(...(data as Listing[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { zones: zones as Zone[], listings };
}

// ─── Analysis ──────────────────────────────────────────────────────

function analyze(zones: Zone[], listings: Listing[]): ZoneHealth[] {
  const byZone = new Map<string, Listing[]>();
  for (const l of listings) {
    if (!l.zone_id) continue;
    if (!byZone.has(l.zone_id)) byZone.set(l.zone_id, []);
    byZone.get(l.zone_id)!.push(l);
  }

  const results: ZoneHealth[] = [];

  for (const zone of zones) {
    if (zone.slug === "otros") continue;
    if (zoneFilter && zone.slug !== zoneFilter) continue;

    const zoneListings = byZone.get(zone.id) ?? [];
    const withCoords = zoneListings.filter((l) => l.lat !== null && l.lng !== null);
    const noCoords = zoneListings.length - withCoords.length;

    const distances = withCoords.map((l) => haversineKm(zone.lat, zone.lng, l.lat!, l.lng!));
    const within1km = distances.filter((d) => d <= 1).length;
    const within2km = distances.filter((d) => d <= 2).length;
    const beyond3km = distances.filter((d) => d > 3).length;
    const beyond5km = distances.filter((d) => d > 5).length;

    const suspicious = withCoords
      .map((l) => ({ listing: l, dist: haversineKm(zone.lat, zone.lng, l.lat!, l.lng!) }))
      .filter((x) => x.dist > 2)
      .sort((a, b) => b.dist - a.dist);

    results.push({
      zone,
      total: zoneListings.length,
      withCoords: withCoords.length,
      noCoords,
      distances,
      medianDist: median(distances),
      within1km,
      within2km,
      beyond3km,
      beyond5km,
      suspicious,
    });
  }

  return results.sort((a, b) => b.beyond3km - a.beyond3km);
}

// ─── Report ────────────────────────────────────────────────────────

function printReport(results: ZoneHealth[]) {
  console.log("\n" + "═".repeat(90));
  console.log("  REPORTE DE SALUD GEOGRAFICA POR ZONA");
  console.log("═".repeat(90));

  const totalListings = results.reduce((s, r) => s + r.total, 0);
  const totalSuspicious = results.reduce((s, r) => s + r.suspicious.length, 0);
  console.log(`  ${totalListings} listings en ${results.length} zonas | ${totalSuspicious} sospechosos (>2km)\n`);

  // Summary table
  console.log(`  ${"Zona".padEnd(28)} ${"Total".padStart(5)} ${"Med.km".padStart(7)} ${"<1km".padStart(6)} ${"<2km".padStart(6)} ${">3km".padStart(6)} ${">5km".padStart(6)}  ${"Salud (<2km)"}`);
  console.log("  " + "─".repeat(88));

  for (const r of results) {
    const health = pct(r.within2km, r.withCoords);
    const healthBar = bar(r.within2km, r.withCoords, 15);
    const flag = r.beyond3km > 0 ? " ⚠" : "";

    console.log(
      `  ${r.zone.name.padEnd(28)} ` +
      `${String(r.total).padStart(5)} ` +
      `${r.medianDist.toFixed(1).padStart(7)} ` +
      `${pct(r.within1km, r.withCoords).padStart(6)} ` +
      `${pct(r.within2km, r.withCoords).padStart(6)} ` +
      `${String(r.beyond3km).padStart(6)} ` +
      `${String(r.beyond5km).padStart(6)} ` +
      ` ${healthBar} ${health}${flag}`
    );
  }

  // Detailed suspicious listings per zone
  const zonesWithSuspicious = results.filter((r) => r.suspicious.length > 0);

  if (zonesWithSuspicious.length > 0) {
    console.log("\n" + "─".repeat(90));
    console.log("  LISTINGS SOSPECHOSOS (>2km del centroide)");
    console.log("─".repeat(90));

    for (const r of zonesWithSuspicious) {
      console.log(`\n  ${r.zone.name} (centroide: ${r.zone.lat.toFixed(4)}, ${r.zone.lng.toFixed(4)}) — ${r.suspicious.length} sospechosos:`);

      for (const s of r.suspicious.slice(0, 10)) {
        const title = (s.listing.title ?? "").slice(0, 60);
        console.log(`    ${s.dist.toFixed(1).padStart(5)}km  ${s.listing.lat!.toFixed(4)}, ${s.listing.lng!.toFixed(4)}  "${title}"`);
      }
      if (r.suspicious.length > 10) {
        console.log(`    ... y ${r.suspicious.length - 10} más`);
      }
    }
  }

  // Zones ranked by health (worst first)
  console.log("\n" + "═".repeat(90));
  console.log("  RANKING (peor salud primero)");
  console.log("═".repeat(90));

  const ranked = [...results]
    .filter((r) => r.withCoords > 0)
    .sort((a, b) => {
      const healthA = a.within2km / a.withCoords;
      const healthB = b.within2km / b.withCoords;
      return healthA - healthB;
    });

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const health = (r.within2km / r.withCoords * 100).toFixed(0);
    const emoji = Number(health) >= 80 ? "  " : Number(health) >= 50 ? "⚠ " : "⛔";
    console.log(`  ${emoji} ${String(i + 1).padStart(2)}. ${r.zone.name.padEnd(28)} ${health}% dentro de 2km  (${r.beyond3km} a >3km, ${r.beyond5km} a >5km)`);
  }

  console.log("\n" + "═".repeat(90) + "\n");
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n📍 Reporte de salud geografica por zona\n");
  const { zones, listings } = await fetchAll();
  console.log(`  ${listings.length} listings | ${zones.length} zonas\n`);
  const results = analyze(zones, listings);
  printReport(results);
}

main().catch((err) => { console.error(err); process.exit(1); });
