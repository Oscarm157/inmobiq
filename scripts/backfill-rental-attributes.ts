#!/usr/bin/env node
/**
 * Backfill rental attributes for existing listings.
 *
 * Reads existing rental listings from Supabase, runs extractRentalAttributes()
 * on each, and writes the extracted fields back to the new rental columns.
 *
 * Usage:
 *   npx tsx scripts/backfill-rental-attributes.ts [options]
 *
 * Options:
 *   --dry-run       Print what would be updated without writing
 *   --limit=<n>     Process only N listings (for testing)
 *   --batch=<n>     Batch size for updates (default: 200)
 */

import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import { extractRentalAttributes } from "../src/lib/data/rental-attributes";
import type { Listing, SourcePortal } from "../src/types/database";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key);
}

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const batchArg = args.find((a) => a.startsWith("--batch="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
const batchSize = batchArg ? parseInt(batchArg.split("=")[1], 10) : 200;

async function main() {
  const sb = getSupabaseClient();

  console.log(`[backfill] Starting rental attributes backfill...`);
  console.log(`[backfill] Options: dry-run=${dryRun}, limit=${limit ?? "all"}, batch=${batchSize}`);

  // Fetch rental listings that haven't been backfilled yet
  // (is_furnished IS NULL means the new columns haven't been populated)
  let query = sb
    .from("listings")
    .select("id, title, description, property_type, listing_type, price_mxn, price_usd, area_m2, area_construccion_m2, area_terreno_m2, bedrooms, bathrooms, source_portal, external_url, scraped_at, created_at, raw_data, zone_id")
    .eq("listing_type", "renta")
    .is("is_furnished", null)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error(`[backfill] Failed to fetch listings: ${error.message}`);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log("[backfill] No rental listings need backfilling. Done.");
    return;
  }

  console.log(`[backfill] Found ${listings.length} rental listings to backfill.`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < listings.length; i += batchSize) {
    const batch = listings.slice(i, i + batchSize);
    const updates: Array<{ id: string; attrs: Record<string, unknown> }> = [];

    for (const row of batch) {
      // Map DB row to Listing-like shape for extractRentalAttributes
      const listing: Listing = {
        id: row.id,
        zone_id: row.zone_id,
        title: row.title ?? "",
        property_type: row.property_type,
        listing_type: row.listing_type,
        price: row.price_mxn ?? 0,
        area_m2: row.area_m2 ?? 0,
        area_construccion_m2: row.area_construccion_m2,
        area_terreno_m2: row.area_terreno_m2,
        price_per_m2: row.area_m2 && row.price_mxn ? row.price_mxn / row.area_m2 : 0,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        source: row.source_portal as SourcePortal,
        source_url: row.external_url ?? "",
        scraped_at: row.scraped_at ?? "",
        created_at: row.created_at ?? "",
        raw_data: row.raw_data as Record<string, unknown> | undefined,
        original_currency: row.price_usd ? "USD" : "MXN",
      };

      const attrs = extractRentalAttributes(listing);

      updates.push({
        id: row.id,
        attrs: {
          is_furnished: attrs.is_furnished,
          maintenance_fee: attrs.maintenance_fee,
          deposit_months: attrs.deposit_months,
          lease_term_months: attrs.lease_term_months,
          pets_allowed: attrs.pets_allowed,
          is_short_term: attrs.is_short_term,
          utilities_included: attrs.utilities_included,
          amenities: attrs.amenities,
        },
      });
    }

    if (dryRun) {
      const withData = updates.filter((u) =>
        u.attrs.is_furnished !== null ||
        u.attrs.maintenance_fee !== null ||
        u.attrs.pets_allowed !== null ||
        (u.attrs.amenities as string[]).length > 0
      );
      console.log(`[backfill] Batch ${Math.floor(i / batchSize) + 1}: ${updates.length} listings, ${withData.length} with extracted data`);
      if (withData.length > 0) {
        console.log(`[backfill]   Sample:`, JSON.stringify(withData[0].attrs, null, 2));
      }
      updated += withData.length;
      skipped += updates.length - withData.length;
      continue;
    }

    // Write updates to DB one by one (Supabase doesn't support bulk partial updates)
    for (const { id, attrs } of updates) {
      const { error: updateErr } = await sb
        .from("listings")
        .update(attrs)
        .eq("id", id);

      if (updateErr) {
        console.error(`[backfill] Failed to update listing ${id}: ${updateErr.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    console.log(`[backfill] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listings.length / batchSize)}: ${updated} updated, ${errors} errors`);
  }

  console.log(`\n[backfill] Done!`);
  console.log(`[backfill]   Updated: ${updated}`);
  console.log(`[backfill]   Skipped: ${skipped}`);
  console.log(`[backfill]   Errors:  ${errors}`);
}

main().catch((err) => {
  console.error("[backfill] Fatal error:", err);
  process.exit(1);
});
