#!/usr/bin/env node
/**
 * Scrape a specific zone URL from inmuebles24.
 *
 * Usage:
 *   npx tsx scripts/scrape-zone-url.ts \
 *     --url="https://www.inmuebles24.com/inmuebles-en-venta-en-buena-vista-ciudad-de-tijuana.html" \
 *     --zone="Buena Vista" \
 *     --pages=5 \
 *     [--dry-run]
 *
 * This will:
 *   1. Create the zone in DB if it doesn't exist
 *   2. Scrape the URL (+ pagination) via Apify
 *   3. Upsert listings with zone assignment
 *   4. Run deduplication
 */

import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { runApifyActorBatched } from "../src/scraper/apify-client";
import {
  getZones,
  getSupabaseClient,
  upsertListings,
} from "../src/scraper/db";
import { runDedup } from "../src/scraper/dedup";
import { slugify } from "../src/scraper/zone-assigner";
import type { RawListing } from "../src/scraper/types";
import type { PropertyType, ListingType } from "../src/types/database";

// ─── Apify response type (same as inmuebles24 adapter) ─────────────────────

interface ApifyI24Listing {
  posting_id: string;
  url: string;
  title: string;
  description_normalized?: string;
  real_estate_type?: { name: string };
  price_operation_types?: Array<{
    operation_type: { name: string };
    prices: Array<{ amount: number; currency: string }>;
  }>;
  main_features?: Record<
    string,
    { label: string; value: string; measure?: string | null }
  >;
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

// ─── CLI args ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (key: string) => {
    const arg = args.find((a) => a.startsWith(`--${key}=`));
    return arg ? arg.split("=").slice(1).join("=") : null;
  };
  const has = (key: string) => args.includes(`--${key}`);

  const url = get("url");
  const zone = get("zone");
  const pages = parseInt(get("pages") ?? "5", 10);
  const dryRun = has("dry-run");

  if (!url || !zone) {
    console.error("Usage: npx tsx scripts/scrape-zone-url.ts --url=<URL> --zone=<ZONE_NAME> [--pages=5] [--dry-run]");
    process.exit(1);
  }

  return { url, zone, pages: isNaN(pages) ? 5 : pages, dryRun };
}

// ─── URL pagination ─────────────────────────────────────────────────────────

function buildPaginatedUrls(baseUrl: string, pages: number): string[] {
  // baseUrl: https://www.inmuebles24.com/inmuebles-en-venta-en-buena-vista-ciudad-de-tijuana.html
  // page 2: https://www.inmuebles24.com/inmuebles-en-venta-en-buena-vista-ciudad-de-tijuana-pagina-2.html
  const urls = [baseUrl];
  const stem = baseUrl.replace(/\.html$/, "");
  for (let p = 2; p <= pages; p++) {
    urls.push(`${stem}-pagina-${p}.html`);
  }
  return urls;
}

// ─── Mappers (reused from inmuebles24 adapter) ─────────────────────────────

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

function mapToRawListing(item: ApifyI24Listing): RawListing {
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
    title: item.title
      ? item.title.replace(/&sup2;/g, "²").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      : null,
    description: item.description_normalized
      ? item.description_normalized.replace(/&sup2;/g, "²").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      : null,
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

// ─── Ensure zone exists ─────────────────────────────────────────────────────

async function ensureZone(zoneName: string): Promise<void> {
  const sb = getSupabaseClient();
  const slug = slugify(zoneName);

  const { data: existing } = await sb
    .from("zones")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    console.log(`[zone] "${zoneName}" (${slug}) already exists`);
    return;
  }

  // Insert with approximate coords (will be refined later with polygon data)
  // Buena Vista, Tijuana: ~32.518, -117.028
  const { error } = await sb.from("zones").insert({
    name: zoneName,
    slug,
    lat: 32.518,
    lng: -117.028,
    city: "Tijuana",
    state: "Baja California",
  });

  if (error) throw new Error(`Failed to create zone: ${error.message}`);
  console.log(`[zone] Created "${zoneName}" (${slug})`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

const ACTOR_ID = "ecomscrape/inmuebles24-property-listings-scraper";

async function main() {
  const { url, zone, pages, dryRun } = parseArgs();
  const slug = slugify(zone);

  console.log(`
╔════════════════════════════════════════════╗
║   Inmobiq Zone Scraper — inmuebles24      ║
╚════════════════════════════════════════════╝
Zone  : ${zone} (${slug})
URL   : ${url}
Pages : ${pages}
DryRun: ${dryRun}
  `);

  // 1. Ensure zone exists in DB
  if (!dryRun) {
    await ensureZone(zone);
  }

  // 2. Build paginated URLs
  const urls = buildPaginatedUrls(url, pages);
  console.log(`[scrape] ${urls.length} URLs to scrape:`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  // 3. Call Apify
  console.log(`\n[scrape] Calling Apify actor…`);
  const items = await runApifyActorBatched<ApifyI24Listing>(
    ACTOR_ID,
    {
      urls,
      max_items_per_url: 50,
      max_retries_per_url: 5,
      ignore_url_failures: true,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        apifyProxyCountry: "MX",
      },
    },
    { batchSize: 5, delayMs: 60_000 },
  );

  // 4. Map to RawListings
  const listings = items.map(mapToRawListing);
  console.log(`[scrape] Mapped ${listings.length} listings from Apify`);

  if (dryRun) {
    console.log(`[dry-run] Sample:`, JSON.stringify(listings[0], null, 2));
    console.log(`[dry-run] Total: ${listings.length} — not saved`);
    return;
  }

  if (listings.length === 0) {
    console.log(`[scrape] No listings found — done`);
    return;
  }

  // 5. Upsert listings
  const zones = await getZones();
  const stats = await upsertListings(listings, zones);
  console.log(
    `[scrape] Results: found=${stats.found}, new=${stats.new_}, ` +
      `updated=${stats.updated}, zone_assigned=${stats.zoneAssigned}`
  );

  // 6. Dedup
  console.log(`\n[dedup] Running deduplication…`);
  const { clustered, newClusters } = await runDedup();
  console.log(`[dedup] ${clustered} listings clustered into ${newClusters} property groups`);

  console.log(`\n✅ Done — zone "${zone}" scraped and imported`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
