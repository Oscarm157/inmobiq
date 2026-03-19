import { createClient } from "@supabase/supabase-js";
import type { PropertyType, ListingType } from "@/types/database";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(url, key);
}

/** Get the start of the current ISO week (Monday) */
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

interface ListingRow {
  zone_id: string;
  property_type: PropertyType;
  listing_type: ListingType;
  price_mxn: number | null;
  area_m2: number | null;
  first_seen_at: string;
}

/**
 * Calculate and upsert weekly snapshots for all zones.
 * Called post-scrape.
 */
export async function calculateWeeklySnapshots(): Promise<{
  zoneSnapshots: number;
  citySnapshots: number;
}> {
  const sb = getSupabaseClient();
  const weekStart = getWeekStart();
  const prevWeekStart = getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000));

  console.log(`[snapshots] calculating week ${weekStart}`);

  // Fetch all active listings
  const { data: listings, error } = await sb
    .from("listings")
    .select("zone_id, property_type, listing_type, price_mxn, area_m2, first_seen_at")
    .eq("is_active", true)
    .not("zone_id", "is", null);

  if (error) throw new Error(`Failed to fetch listings for snapshots: ${error.message}`);
  if (!listings?.length) return { zoneSnapshots: 0, citySnapshots: 0 };

  // Fetch new and removed counts per zone for this week
  const { data: newThisWeek } = await sb
    .from("listings")
    .select("zone_id, property_type, listing_type")
    .gte("first_seen_at", weekStart);

  const { data: removedThisWeek } = await sb
    .from("listings")
    .select("zone_id, property_type, listing_type")
    .eq("is_active", false)
    .gte("updated_at", weekStart);

  // Group listings by zone + property_type + listing_type
  type GroupKey = `${string}|${PropertyType}|${ListingType}`;
  const groups = new Map<GroupKey, ListingRow[]>();

  for (const l of listings as ListingRow[]) {
    const key: GroupKey = `${l.zone_id}|${l.property_type}|${l.listing_type}`;
    const group = groups.get(key) ?? [];
    group.push(l);
    groups.set(key, group);
  }

  // Build zone snapshot records
  const zoneSnapshotRecords = [];
  for (const [key, group] of groups) {
    const [zone_id, property_type, listing_type] = key.split("|") as [
      string,
      PropertyType,
      ListingType
    ];

    const prices = group.map((l) => l.price_mxn).filter((p): p is number => p !== null);
    const areas = group.map((l) => l.area_m2).filter((a): a is number => a !== null);
    const pricesPerM2 = group
      .filter((l) => l.price_mxn && l.area_m2)
      .map((l) => l.price_mxn! / l.area_m2!);

    const newCount = (newThisWeek ?? []).filter(
      (l) =>
        l.zone_id === zone_id &&
        l.property_type === property_type &&
        l.listing_type === listing_type
    ).length;

    const removedCount = (removedThisWeek ?? []).filter(
      (l) =>
        l.zone_id === zone_id &&
        l.property_type === property_type &&
        l.listing_type === listing_type
    ).length;

    zoneSnapshotRecords.push({
      zone_id,
      week_start: weekStart,
      property_type,
      listing_type,
      count_active: group.length,
      avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      median_price: prices.length ? median(prices) : null,
      min_price: prices.length ? Math.min(...prices) : null,
      max_price: prices.length ? Math.max(...prices) : null,
      avg_price_per_m2: pricesPerM2.length
        ? pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length
        : null,
      total_area_m2: areas.length ? areas.reduce((a, b) => a + b, 0) : null,
      new_listings: newCount,
      removed_listings: removedCount,
    });
  }

  // Upsert zone snapshots
  let zoneSnapshots = 0;
  if (zoneSnapshotRecords.length) {
    const { error: zErr } = await sb.from("snapshots").upsert(zoneSnapshotRecords, {
      onConflict: "zone_id,week_start,property_type,listing_type",
      ignoreDuplicates: false,
    });
    if (zErr) throw new Error(`Failed to upsert zone snapshots: ${zErr.message}`);
    zoneSnapshots = zoneSnapshotRecords.length;
  }

  // City-level snapshots (aggregate across all zones)
  const cityGroups = new Map<`${PropertyType}|${ListingType}`, ListingRow[]>();
  for (const l of listings as ListingRow[]) {
    const key: `${PropertyType}|${ListingType}` = `${l.property_type}|${l.listing_type}`;
    const group = cityGroups.get(key) ?? [];
    group.push(l);
    cityGroups.set(key, group);
  }

  const citySnapshotRecords = [];
  for (const [key, group] of cityGroups) {
    const [property_type, listing_type] = key.split("|") as [PropertyType, ListingType];
    const prices = group.map((l) => l.price_mxn).filter((p): p is number => p !== null);
    const areas = group.map((l) => l.area_m2).filter((a): a is number => a !== null);
    const pricesPerM2 = group
      .filter((l) => l.price_mxn && l.area_m2)
      .map((l) => l.price_mxn! / l.area_m2!);

    const newCount = (newThisWeek ?? []).filter(
      (l) => l.property_type === property_type && l.listing_type === listing_type
    ).length;
    const removedCount = (removedThisWeek ?? []).filter(
      (l) => l.property_type === property_type && l.listing_type === listing_type
    ).length;

    citySnapshotRecords.push({
      city: "Tijuana",
      week_start: weekStart,
      property_type,
      listing_type,
      count_active: group.length,
      avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      median_price: prices.length ? median(prices) : null,
      min_price: prices.length ? Math.min(...prices) : null,
      max_price: prices.length ? Math.max(...prices) : null,
      avg_price_per_m2: pricesPerM2.length
        ? pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length
        : null,
      total_area_m2: areas.length ? areas.reduce((a, b) => a + b, 0) : null,
      new_listings: newCount,
      removed_listings: removedCount,
    });
  }

  let citySnapshots = 0;
  if (citySnapshotRecords.length) {
    const { error: cErr } = await sb.from("city_snapshots").upsert(citySnapshotRecords, {
      onConflict: "city,week_start,property_type,listing_type",
      ignoreDuplicates: false,
    });
    if (cErr) throw new Error(`Failed to upsert city snapshots: ${cErr.message}`);
    citySnapshots = citySnapshotRecords.length;
  }

  console.log(`[snapshots] done: ${zoneSnapshots} zone, ${citySnapshots} city snapshots`);
  return { zoneSnapshots, citySnapshots };
}
