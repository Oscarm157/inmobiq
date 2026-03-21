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

const USD_TO_MXN = 17.5; // Approximate exchange rate for price normalization

/** Get the effective price in MXN (using USD conversion as fallback) */
function effectivePrice(l: ListingRow): number | null {
  if (l.price_mxn) return l.price_mxn;
  if (l.price_usd) return l.price_usd * USD_TO_MXN;
  return null;
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
  price_usd: number | null;
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

  // Fetch all active deduplicated listings (canonical or unclustered)
  const { data: listings, error } = await sb
    .from("v_deduplicated_listings")
    .select("zone_id, property_type, listing_type, price_mxn, price_usd, area_m2, first_seen_at")
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

    // Filter listings with valid area for price calculations (match getZoneMetrics filters)
    const validListings = group.filter((l) => {
      const a = l.area_m2;
      return a !== null && a > 10 && a < 50000;
    });

    const prices = validListings.map(effectivePrice).filter((p): p is number => p !== null && p > 0);
    const areas = validListings.map((l) => l.area_m2).filter((a): a is number => a !== null);
    const pricesPerM2 = validListings
      .map((l) => {
        const p = effectivePrice(l);
        return p && l.area_m2 ? p / l.area_m2 : null;
      })
      .filter((v): v is number => v !== null && v > 0);

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
      avg_price: prices.length ? median(prices) : 0,
      median_price: prices.length ? median(prices) : 0,
      min_price: prices.length ? Math.min(...prices) : 0,
      max_price: prices.length ? Math.max(...prices) : 0,
      avg_price_per_m2: pricesPerM2.length ? median(pricesPerM2) : 0,
      total_area_m2: areas.length ? areas.reduce((a, b) => a + b, 0) : 0,
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

  // City-level snapshot (single aggregate row matching existing schema)
  const allListings = listings as ListingRow[];
  const allPricesPerM2 = allListings
    .filter((l) => l.area_m2 !== null && l.area_m2 > 10 && l.area_m2 < 50000)
    .map((l) => {
      const p = effectivePrice(l);
      return p && l.area_m2 ? p / l.area_m2 : null;
    })
    .filter((v): v is number => v !== null && v > 0);

  const uniqueZones = new Set(allListings.map((l) => l.zone_id));

  const citySnapshotRecord = {
    city: "Tijuana",
    week_start: weekStart,
    avg_price_per_m2: allPricesPerM2.length ? median(allPricesPerM2) : 0,
    count_active: allListings.length,
    total_zones: uniqueZones.size,
  };

  let citySnapshots = 0;
  const { error: cErr } = await sb.from("city_snapshots").upsert([citySnapshotRecord], {
    onConflict: "city,week_start",
    ignoreDuplicates: false,
  });
  if (cErr) throw new Error(`Failed to upsert city snapshots: ${cErr.message}`);
  citySnapshots = 1;

  console.log(`[snapshots] done: ${zoneSnapshots} zone, ${citySnapshots} city snapshots`);
  return { zoneSnapshots, citySnapshots };
}
