#!/usr/bin/env node
/**
 * Import Inmuebles24 listings from Apify JSON export into Inmobiq pipeline.
 *
 * Usage:
 *   npx tsx scripts/import-apify.ts <json-file> [--dry-run]
 */

import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import type { RawListing } from "../src/scraper/types";
import type { PropertyType, ListingType } from "../src/types/database";
import {
  getZones,
  createScraperRun,
  finalizeScraperRun,
  upsertListings,
} from "../src/scraper/db";
import { calculateWeeklySnapshots } from "../src/scraper/snapshots";
import { runDedup } from "../src/scraper/dedup";

// ─── Apify → RawListing mapping ────────────────────────────────────────────

interface ApifyListing {
  posting_id: string;
  url: string;
  title: string;
  description_normalized?: string;
  real_estate_type?: { name: string };
  price_operation_types?: Array<{
    operation_type: { name: string };
    prices: Array<{ amount: number; currency: string }>;
  }>;
  main_features?: Record<string, { label: string; value: string; measure?: string | null }>;
  posting_location?: {
    address?: { name: string };
    location?: { name: string };
    posting_geolocation?: {
      geolocation?: { latitude: number; longitude: number };
    };
  };
  visible_pictures?: {
    pictures: Array<{ url730x532?: string; url360x266?: string }>;
  };
  [key: string]: unknown;
}

function mapPropertyType(name: string | undefined): PropertyType {
  if (!name) return "casa";
  const lower = name.toLowerCase();
  if (lower.includes("departamento")) return "departamento";
  if (lower.includes("terreno")) return "terreno";
  if (lower.includes("local") || lower.includes("comercial")) return "local";
  if (lower.includes("oficina")) return "oficina";
  return "casa";
}

function mapListingType(name: string | undefined): ListingType {
  if (!name) return "venta";
  return name.toLowerCase().includes("renta") ? "renta" : "venta";
}

function getFeatureValue(
  features: Record<string, { label: string; value: string }> | undefined,
  ...keywords: string[]
): number | null {
  if (!features) return null;
  for (const [, feat] of Object.entries(features)) {
    const label = feat.label.toLowerCase();
    if (keywords.some((kw) => label.includes(kw))) {
      const n = parseFloat(feat.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
}

function convertToRawListing(item: ApifyListing): RawListing {
  const op = item.price_operation_types?.[0];
  const price = op?.prices?.[0];
  const isMxn = price?.currency === "MXN" || price?.currency === "MN";
  const priceMxn = isMxn ? price.amount : null;
  const priceUsd = price?.currency === "USD" ? price.amount : null;

  const geo = item.posting_location?.posting_geolocation?.geolocation;
  const address = [
    item.posting_location?.address?.name,
    item.posting_location?.location?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const images =
    item.visible_pictures?.pictures
      ?.map((p) => p.url730x532 || p.url360x266)
      .filter((url): url is string => !!url) ?? [];

  const area =
    getFeatureValue(item.main_features, "superficie construí", "construida", "terreno") ??
    getFeatureValue(item.main_features, "superficie");

  return {
    source_portal: "inmuebles24",
    external_id: String(item.posting_id),
    external_url: item.url.startsWith("http")
      ? item.url
      : `https://www.inmuebles24.com${item.url}`,
    title: item.title ?? null,
    description: item.description_normalized ?? null,
    property_type: mapPropertyType(item.real_estate_type?.name),
    listing_type: mapListingType(op?.operation_type?.name),
    price_mxn: priceMxn,
    price_usd: priceUsd,
    area_m2: area,
    bedrooms: getFeatureValue(item.main_features, "recámara", "recamara"),
    bathrooms: getFeatureValue(item.main_features, "baño", "bano"),
    parking: getFeatureValue(item.main_features, "estacionamiento"),
    lat: geo?.latitude ?? null,
    lng: geo?.longitude ?? null,
    address: address || null,
    images,
    raw_data: item as unknown as Record<string, unknown>,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-apify.ts <json-file> [--dry-run]");
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const raw: ApifyListing[] = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  console.log(`\n[import] Loaded ${raw.length} listings from ${path.basename(fullPath)}`);

  const listings = raw.map(convertToRawListing);

  // Summary
  const types = new Map<string, number>();
  for (const l of listings) {
    const key = `${l.property_type}/${l.listing_type}`;
    types.set(key, (types.get(key) ?? 0) + 1);
  }
  console.log("[import] Breakdown:");
  for (const [key, count] of types) console.log(`  ${key}: ${count}`);

  const withCoords = listings.filter((l) => l.lat && l.lng).length;
  console.log(`[import] With lat/lng: ${withCoords}/${listings.length}`);

  if (dryRun) {
    console.log("\n[dry-run] Sample mapped listing:");
    console.log(JSON.stringify(listings[0], null, 2));
    console.log(`\n[dry-run] ${listings.length} listings — not saved`);
    return;
  }

  // Upsert into Supabase
  const zones = await getZones();
  console.log(`[import] ${zones.length} zones loaded from Supabase`);

  const runId = await createScraperRun("inmuebles24");
  console.log(`[import] Scraper run ID: ${runId}`);

  const stats = await upsertListings(listings, zones);
  console.log(
    `[import] Results: found=${stats.found}, new=${stats.new_}, ` +
      `updated=${stats.updated}, zone_assigned=${stats.zoneAssigned}`
  );

  await finalizeScraperRun(runId, {
    status: "completed",
    listings_found: stats.found,
    listings_new: stats.new_,
    listings_updated: stats.updated,
    errors: [],
  });

  // Dedup
  try {
    console.log("[import] Running deduplication…");
    const { clustered, newClusters } = await runDedup();
    console.log(
      `[import] Dedup: ${clustered} listings clustered into ${newClusters} property groups`
    );
  } catch (err) {
    console.error(`[import] Dedup error: ${err}`);
  }

  // Snapshots
  try {
    console.log("[import] Calculating snapshots…");
    const { zoneSnapshots, citySnapshots } = await calculateWeeklySnapshots();
    console.log(`[import] ${zoneSnapshots} zone snapshots, ${citySnapshots} city snapshots`);
  } catch (err) {
    console.error(`[import] Snapshot error: ${err}`);
  }

  console.log("\n✅ Import complete");
}

main().catch((err) => {
  console.error("[import] Fatal:", err);
  process.exit(1);
});
