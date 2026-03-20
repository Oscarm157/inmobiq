import { createClient } from "@supabase/supabase-js";
import type { RawListing, ScraperError, Zone } from "./types";
import type { SourcePortal } from "@/types/database";
import { assignZone } from "./zone-assigner";
import { computeFingerprints } from "./dedup";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  return createClient(url, key);
}

/** Fetch all zones from DB */
export async function getZones(): Promise<Zone[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("zones")
    .select("id, name, slug, lat, lng")
    .order("name");
  if (error) throw new Error(`Failed to fetch zones: ${error.message}`);
  return (data ?? []) as Zone[];
}

/** Create a new scraper_runs record */
export async function createScraperRun(portal: SourcePortal): Promise<string> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("scraper_runs")
    .insert({ portal, status: "running" })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create scraper run: ${error.message}`);
  return data.id as string;
}

/** Finalize a scraper_runs record */
export async function finalizeScraperRun(
  runId: string,
  stats: {
    status: "completed" | "failed";
    listings_found: number;
    listings_new: number;
    listings_updated: number;
    errors: ScraperError[];
  }
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from("scraper_runs")
    .update({
      status: stats.status,
      completed_at: new Date().toISOString(),
      listings_found: stats.listings_found,
      listings_new: stats.listings_new,
      listings_updated: stats.listings_updated,
      errors: stats.errors,
    })
    .eq("id", runId);
  if (error) throw new Error(`Failed to finalize scraper run: ${error.message}`);
}

/** Log a scraper error */
export async function logScraperError(
  runId: string,
  err: ScraperError
): Promise<void> {
  const sb = getSupabaseClient();
  await sb.from("scraper_errors").insert({
    run_id: runId,
    portal: err.portal,
    url: err.url,
    error_type: err.error_type,
    error_message: err.error_message,
  });
}

export interface UpsertStats {
  found: number;
  new_: number;
  updated: number;
  zoneAssigned: number;
}

/**
 * Upsert listings into Supabase with zone assignment.
 * Returns stats for the run.
 */
export async function upsertListings(
  listings: RawListing[],
  zones: Zone[]
): Promise<UpsertStats> {
  if (!listings.length) return { found: 0, new_: 0, updated: 0, zoneAssigned: 0 };

  const sb = getSupabaseClient();
  const now = new Date().toISOString();

  // First, fetch existing external_ids for this batch to detect new vs updated
  const portal = listings[0].source_portal;
  const externalIds = listings.map((l) => l.external_id);

  const { data: existing } = await sb
    .from("listings")
    .select("external_id")
    .eq("source_portal", portal)
    .in("external_id", externalIds);

  const existingSet = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id));
  let new_ = 0;
  let updated = 0;
  let zoneAssigned = 0;

  // Build upsert records
  const records = listings.map((l) => {
    const assignment = assignZone(l.lat, l.lng, l.address, l.title, zones);
    if (assignment.zoneId) zoneAssigned++;

    const isNew = !existingSet.has(l.external_id);
    if (isNew) new_++;
    else updated++;

    const fp = computeFingerprints({
      zone_id: assignment.zoneId,
      property_type: l.property_type,
      listing_type: l.listing_type,
      area_m2: l.area_m2,
      price_mxn: l.price_mxn,
      price_usd: l.price_usd,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      lat: l.lat,
      lng: l.lng,
    });

    return {
      zone_id: assignment.zoneId,
      source_portal: l.source_portal,
      external_id: l.external_id,
      external_url: l.external_url,
      title: l.title,
      description: l.description,
      property_type: l.property_type,
      listing_type: l.listing_type,
      price_mxn: l.price_mxn,
      price_usd: l.price_usd,
      area_m2: l.area_m2,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      parking: l.parking,
      lat: l.lat,
      lng: l.lng,
      address: l.address,
      images: l.images,
      raw_data: l.raw_data,
      fingerprint_struct: fp.struct,
      fingerprint_geo: fp.geo,
      scraped_at: now,
      last_seen_at: now,
      is_active: true,
      ...(isNew ? { first_seen_at: now } : {}),
    };
  });

  // Batch upsert in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const { error } = await sb
      .from("listings")
      .upsert(chunk, {
        onConflict: "source_portal,external_id",
        ignoreDuplicates: false,
      });
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }

  return { found: listings.length, new_, updated, zoneAssigned };
}

/**
 * Mark listings as inactive if they were not seen in the last 2 runs.
 * "Not seen in 2 runs" = last_seen_at older than 2× scrape interval (2 days).
 */
export async function deactivateStaleListings(portal: SourcePortal): Promise<number> {
  const sb = getSupabaseClient();
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1_000).toISOString();

  const { data, error } = await sb
    .from("listings")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("source_portal", portal)
    .eq("is_active", true)
    .lt("last_seen_at", cutoff)
    .select("id");

  if (error) throw new Error(`Deactivate stale listings failed: ${error.message}`);
  return (data ?? []).length;
}
