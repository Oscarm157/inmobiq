import { createClient } from "@supabase/supabase-js";
import type { PropertyType, ListingType } from "@/types/database";
import { isValidListing, effectivePriceMxn } from "@/lib/data/normalize";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(url, key);
}

/** Get the effective price in MXN (using USD conversion as fallback) */
function effectivePrice(l: ListingRow): number | null {
  return effectivePriceMxn(l.price_mxn, l.price_usd);
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

    // Filter listings with valid area and normalized prices
    const validListings = group.filter((l) => {
      const a = l.area_m2;
      if (a === null || a <= 10 || a >= 50000) return false;
      // Exclude suspected misclassified rentals (sale price too low for property type)
      return isValidListing(property_type, listing_type, effectivePrice(l), a).isValid;
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
    .filter((l) => {
      if (l.area_m2 === null || l.area_m2 <= 10 || l.area_m2 >= 50000) return false;
      return isValidListing(l.property_type, l.listing_type, effectivePrice(l), l.area_m2).isValid;
    })
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

  // ── Rental snapshots ──────────────────────────────────────────
  const rentalSnapshots = await calculateRentalSnapshots(sb, weekStart);

  console.log(`[snapshots] done: ${zoneSnapshots} zone, ${citySnapshots} city, ${rentalSnapshots} rental snapshots`);
  return { zoneSnapshots, citySnapshots };
}

/* ------------------------------------------------------------------ */
/*  Rental-specific snapshots                                         */
/* ------------------------------------------------------------------ */

interface RentalListingRow {
  zone_id: string;
  price_mxn: number | null;
  price_usd: number | null;
  area_m2: number | null;
  is_furnished: boolean | null;
  maintenance_fee: number | null;
  first_seen_at: string;
  last_seen_at: string;
}

/**
 * Calculate and upsert rental_snapshots for all zones with active rental listings.
 */
async function calculateRentalSnapshots(
  sb: ReturnType<typeof createClient>,
  weekStart: string,
): Promise<number> {
  const { data: rentals, error } = await sb
    .from("listings")
    .select("zone_id, price_mxn, price_usd, area_m2, is_furnished, maintenance_fee, first_seen_at, last_seen_at")
    .eq("listing_type", "renta")
    .eq("is_active", true)
    .not("zone_id", "is", null);

  if (error) {
    console.error(`[snapshots] Failed to fetch rental listings: ${error.message}`);
    return 0;
  }
  if (!rentals?.length) return 0;

  // Group by zone
  const byZone = new Map<string, RentalListingRow[]>();
  for (const r of rentals as RentalListingRow[]) {
    const group = byZone.get(r.zone_id) ?? [];
    group.push(r);
    byZone.set(r.zone_id, group);
  }

  const records = [];
  const now = Date.now();

  for (const [zone_id, listings] of byZone) {
    // Price per m2
    const rentsPerM2 = listings
      .filter((l) => l.area_m2 && l.area_m2 > 0)
      .map((l) => {
        const price = effectivePriceMxn(l.price_mxn, l.price_usd);
        return price && l.area_m2 ? price / l.area_m2 : null;
      })
      .filter((v): v is number => v !== null && v > 0);

    const allPrices = listings
      .map((l) => effectivePriceMxn(l.price_mxn, l.price_usd))
      .filter((p): p is number => p !== null && p > 0);

    // Furnished breakdown
    const furnished = listings.filter((l) => l.is_furnished === true);
    const unfurnished = listings.filter((l) => l.is_furnished === false);

    // Furnished premium
    let furnished_premium_pct: number | null = null;
    if (furnished.length >= 2 && unfurnished.length >= 2) {
      const furnPerM2 = furnished
        .filter((l) => l.area_m2 && l.area_m2 > 0)
        .map((l) => {
          const p = effectivePriceMxn(l.price_mxn, l.price_usd);
          return p && l.area_m2 ? p / l.area_m2 : null;
        })
        .filter((v): v is number => v !== null);
      const unfurnPerM2 = unfurnished
        .filter((l) => l.area_m2 && l.area_m2 > 0)
        .map((l) => {
          const p = effectivePriceMxn(l.price_mxn, l.price_usd);
          return p && l.area_m2 ? p / l.area_m2 : null;
        })
        .filter((v): v is number => v !== null);

      if (furnPerM2.length && unfurnPerM2.length) {
        const avgFurn = furnPerM2.reduce((a, b) => a + b, 0) / furnPerM2.length;
        const avgUnfurn = unfurnPerM2.reduce((a, b) => a + b, 0) / unfurnPerM2.length;
        if (avgUnfurn > 0) {
          furnished_premium_pct = Math.round(((avgFurn - avgUnfurn) / avgUnfurn) * 100);
        }
      }
    }

    // USD count
    const usd_listings_count = listings.filter((l) => l.price_usd !== null && l.price_usd > 0).length;

    // Average listing duration (days since first_seen)
    const durations = listings
      .filter((l) => l.first_seen_at)
      .map((l) => {
        const firstSeen = new Date(l.first_seen_at).getTime();
        return (now - firstSeen) / (1000 * 60 * 60 * 24);
      })
      .filter((d) => d > 0 && d < 365);

    const avg_listing_duration_days = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    // Median maintenance fee
    const maintFees = listings
      .map((l) => l.maintenance_fee)
      .filter((f): f is number => f !== null && f > 0)
      .sort((a, b) => a - b);
    const median_maintenance_fee = maintFees.length
      ? maintFees[Math.floor(maintFees.length / 2)]
      : null;

    records.push({
      zone_id,
      week_start: weekStart,
      avg_rent_per_m2: rentsPerM2.length ? Math.round(median(rentsPerM2)) : null,
      median_rent: allPrices.length ? Math.round(median(allPrices)) : null,
      total_rental_listings: listings.length,
      furnished_count: furnished.length,
      unfurnished_count: unfurnished.length,
      furnished_premium_pct,
      usd_listings_count,
      avg_listing_duration_days,
      median_maintenance_fee,
    });
  }

  if (!records.length) return 0;

  const { error: upsertErr } = await sb.from("rental_snapshots").upsert(records, {
    onConflict: "zone_id,week_start",
    ignoreDuplicates: false,
  });

  if (upsertErr) {
    console.error(`[snapshots] Failed to upsert rental snapshots: ${upsertErr.message}`);
    return 0;
  }

  console.log(`[snapshots] ${records.length} rental snapshots upserted`);
  return records.length;
}
