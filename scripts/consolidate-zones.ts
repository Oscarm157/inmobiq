#!/usr/bin/env node
/**
 * One-time migration: consolidate 132+ auto-created zones into ~30 canonical zones.
 *
 * What it does:
 * 1. Identifies canonical zones (those with bounding boxes in zone-assigner.ts)
 * 2. Creates "Otros" catch-all zone
 * 3. Reassigns listings from extra zones to the nearest canonical zone (within 3km) or "Otros"
 * 4. Deletes snapshots for extra zones
 * 5. Deletes extra zones
 * 6. Recalculates weekly snapshots
 *
 * Usage:
 *   npx tsx scripts/consolidate-zones.ts [--dry-run]
 */

import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import { calculateWeeklySnapshots } from "../src/scraper/snapshots";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const dryRun = process.argv.includes("--dry-run");

// Canonical zone slugs (from zone-assigner.ts ZONE_BBOXES)
const CANONICAL_SLUGS = new Set([
  "zona-rio", "cacho", "chapultepec", "hipodromo", "agua-caliente",
  "lomas-de-agua-caliente", "centro", "libertad", "soler", "federal",
  "playas-de-tijuana", "baja-malibu", "real-del-mar", "san-antonio-del-mar",
  "punta-bandera", "costa-coronado", "otay", "la-mesa", "las-americas",
  "villa-fontana", "montecarlo", "otay-universidad", "residencial-del-bosque",
  "santa-fe", "natura", "colinas-de-california", "lomas-virreyes",
  "insurgentes", "el-florido", "terrazas-de-la-presa",
]);

interface Zone {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}

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

function findNearestCanonical(zone: Zone, canonicalZones: Zone[], maxKm = 3): Zone | null {
  let best: Zone | null = null;
  let bestDist = Infinity;

  for (const c of canonicalZones) {
    const dist = haversineKm(zone.lat, zone.lng, c.lat, c.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }

  return bestDist <= maxKm ? best : null;
}

async function main() {
  console.log(`\n=== Zone Consolidation ${dryRun ? "(DRY RUN)" : ""} ===\n`);

  // 1. Fetch all zones
  const { data: allZones, error: zErr } = await sb
    .from("zones")
    .select("id, name, slug, lat, lng")
    .order("name");

  if (zErr || !allZones) {
    console.error("Failed to fetch zones:", zErr?.message);
    process.exit(1);
  }

  const canonicalZones = allZones.filter((z) => CANONICAL_SLUGS.has(z.slug));
  const extraZones = allZones.filter((z) => !CANONICAL_SLUGS.has(z.slug) && z.slug !== "otros");

  console.log(`Total zones: ${allZones.length}`);
  console.log(`Canonical zones: ${canonicalZones.length}`);
  console.log(`Extra zones to consolidate: ${extraZones.length}`);

  if (extraZones.length === 0) {
    console.log("\nNo extra zones to consolidate. Done!");
    return;
  }

  // 2. Ensure "Otros" zone exists
  let otrosZone = allZones.find((z) => z.slug === "otros");
  if (!otrosZone && !dryRun) {
    const { data, error } = await sb
      .from("zones")
      .upsert(
        { name: "Otros", slug: "otros", city: "Tijuana", state: "Baja California", lat: 32.5, lng: -117.0 },
        { onConflict: "slug", ignoreDuplicates: true },
      )
      .select("id, name, slug, lat, lng")
      .single();

    if (error) {
      console.error("Failed to create 'Otros' zone:", error.message);
      process.exit(1);
    }
    otrosZone = data as Zone;
    console.log(`Created "Otros" zone: ${otrosZone.id}`);
  } else if (!otrosZone) {
    console.log('Would create "Otros" zone');
  }

  // 3. Build reassignment map
  const reassignments = new Map<string, { target: Zone; count: number }>();
  let totalListings = 0;

  for (const extra of extraZones) {
    const nearest = findNearestCanonical(extra, canonicalZones);
    const target = nearest ?? otrosZone!;

    // Count listings in this zone
    const { count } = await sb
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("zone_id", extra.id);

    const listingCount = count ?? 0;
    totalListings += listingCount;

    const dist = nearest
      ? haversineKm(extra.lat, extra.lng, nearest.lat, nearest.lng).toFixed(1)
      : ">3km";

    reassignments.set(extra.id, { target, count: listingCount });

    console.log(
      `  ${extra.name} (${listingCount} listings) → ${target.name} [${dist}${nearest ? "km" : ""}]`
    );
  }

  console.log(`\nTotal listings to reassign: ${totalListings}`);

  if (dryRun) {
    console.log("\n(Dry run — no changes made)");
    return;
  }

  // 4. Reassign listings
  console.log("\nReassigning listings...");
  let reassigned = 0;

  for (const [extraId, { target }] of reassignments) {
    const { error, count } = await sb
      .from("listings")
      .update({ zone_id: target.id })
      .eq("zone_id", extraId);

    if (error) {
      console.error(`  Failed to reassign from ${extraId}: ${error.message}`);
    } else {
      reassigned += count ?? 0;
    }
  }
  console.log(`  Reassigned ${reassigned} listings`);

  // 5. Delete snapshots for extra zones
  console.log("Deleting old snapshots for extra zones...");
  const extraIds = extraZones.map((z) => z.id);

  const { error: snapErr } = await sb
    .from("snapshots")
    .delete()
    .in("zone_id", extraIds);

  if (snapErr) {
    console.error("Failed to delete snapshots:", snapErr.message);
  } else {
    console.log("  Snapshots deleted");
  }

  // 6. Delete extra zones
  console.log("Deleting extra zones...");
  const { error: delErr } = await sb
    .from("zones")
    .delete()
    .in("id", extraIds);

  if (delErr) {
    console.error("Failed to delete zones:", delErr.message);
  } else {
    console.log(`  Deleted ${extraIds.length} extra zones`);
  }

  // 7. Recalculate snapshots
  console.log("\nRecalculating weekly snapshots...");
  try {
    const result = await calculateWeeklySnapshots();
    console.log(`  Created ${result.zoneSnapshots} zone snapshots, ${result.citySnapshots} city snapshots`);
  } catch (e) {
    console.error("Failed to recalculate snapshots:", e);
  }

  // Final verification
  const { count: finalCount } = await sb
    .from("zones")
    .select("id", { count: "exact", head: true });

  console.log(`\n=== Done! ${finalCount} zones remaining ===`);
}

main().catch(console.error);
