import { createHash } from "crypto";
import { getSupabaseClient } from "./db";
import { USD_TO_MXN } from "@/lib/data/normalize";

// ─── Fingerprint Computation (pure, no DB) ──────────────────────────────────

interface FingerprintInput {
  zone_id: string | null;
  property_type: string;
  listing_type: string;
  area_m2: number | null;
  price_mxn: number | null;
  price_usd: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lat: number | null;
  lng: number | null;
}

function md5(raw: string): string {
  return createHash("md5").update(raw).digest("hex");
}

/**
 * Compute structural and geo fingerprints for a listing.
 * Returns null for each fingerprint that cannot be computed (missing data).
 */
export function computeFingerprints(listing: FingerprintInput): {
  struct: string | null;
  geo: string | null;
} {
  // ── Structural fingerprint ──
  // Requires: zone_id, area, and at least one price
  let struct: string | null = null;
  const priceMxn =
    listing.price_mxn ??
    (listing.price_usd ? listing.price_usd * USD_TO_MXN : null);

  if (listing.zone_id && listing.area_m2 && priceMxn) {
    const areaRounded = Math.round(listing.area_m2 / 10) * 10;
    const priceRounded = Math.round(priceMxn / 10_000) * 10_000;
    const beds = listing.bedrooms ?? 0;
    const baths = listing.bathrooms ?? 0;
    const raw = `${listing.zone_id}|${listing.property_type}|${listing.listing_type}|${areaRounded}|${beds}|${baths}|${priceRounded}`;
    struct = md5(raw);
  }

  // ── Geo fingerprint ──
  // Requires: lat/lng
  let geo: string | null = null;
  if (listing.lat != null && listing.lng != null) {
    const latR = listing.lat.toFixed(4);
    const lngR = listing.lng.toFixed(4);
    const beds = listing.bedrooms ?? 0;
    const baths = listing.bathrooms ?? 0;
    const raw = `${latR}|${lngR}|${listing.property_type}|${listing.listing_type}|${beds}|${baths}`;
    geo = md5(raw);
  }

  return { struct, geo };
}

// ─── Completeness Score ─────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  title: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  price_mxn: number | null;
  price_usd: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[] | null;
  address: string | null;
  last_seen_at: string;
  source_portal: string;
  fingerprint_struct: string | null;
  fingerprint_geo: string | null;
  cluster_id: string | null;
}

function completenessScore(listing: ListingRow): number {
  let score = 0;
  if (listing.title) score += 1;
  if (listing.description) score += 2;
  if (listing.lat != null) score += 2;
  if (listing.price_mxn != null) score += 1;
  if (listing.price_usd != null) score += 1;
  if (listing.area_m2 != null) score += 1;
  if (listing.bedrooms != null) score += 1;
  if (listing.bathrooms != null) score += 1;
  if (listing.images && listing.images.length > 0) score += 1;
  if (listing.images && listing.images.length > 3) score += 1;
  if (listing.address) score += 1;
  return score;
}

// ─── Haversine Distance (meters) ────────────────────────────────────────────

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Main Dedup ─────────────────────────────────────────────────────────────

interface DedupResult {
  clustered: number;
  newClusters: number;
}

/**
 * Run deduplication on active listings that are not yet clustered.
 * Groups by fingerprint_struct, then by fingerprint_geo (with price proximity).
 */
export async function runDedup(): Promise<DedupResult> {
  const sb = getSupabaseClient();
  let clustered = 0;
  let newClusters = 0;

  // ── Step 1: Structural fingerprint clustering ──
  // Find all active unclustered listings with a structural fingerprint
  const { data: unclustered, error: fetchErr } = await sb
    .from("listings")
    .select(
      "id, title, description, lat, lng, price_mxn, price_usd, area_m2, bedrooms, bathrooms, images, address, last_seen_at, source_portal, fingerprint_struct, fingerprint_geo, cluster_id",
    )
    .eq("is_active", true)
    .is("cluster_id", null)
    .not("fingerprint_struct", "is", null);

  if (fetchErr) throw new Error(`Dedup fetch failed: ${fetchErr.message}`);
  if (!unclustered || unclustered.length === 0) return { clustered: 0, newClusters: 0 };

  // Group by fingerprint_struct
  const structGroups = new Map<string, ListingRow[]>();
  for (const row of unclustered as ListingRow[]) {
    if (!row.fingerprint_struct) continue;
    const group = structGroups.get(row.fingerprint_struct) ?? [];
    group.push(row);
    structGroups.set(row.fingerprint_struct, group);
  }

  // Process groups with 2+ members
  for (const [fp, members] of structGroups) {
    if (members.length < 2) continue;

    // Safety check: if members have lat/lng and are >50m apart, skip
    const withCoords = members.filter((m) => m.lat != null && m.lng != null);
    if (withCoords.length >= 2) {
      const ref = withCoords[0];
      const tooFar = withCoords.some(
        (m) =>
          m !== ref &&
          haversineMeters(ref.lat!, ref.lng!, m.lat!, m.lng!) > 50,
      );
      if (tooFar) continue;
    }

    // Pick canonical: highest completeness score, then most recent last_seen_at
    const sorted = members.sort((a, b) => {
      const scoreDiff = completenessScore(b) - completenessScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
    });
    const canonical = sorted[0];

    // Collect unique portals
    const portals = [...new Set(members.map((m) => m.source_portal))];

    // Create cluster
    const { data: cluster, error: clusterErr } = await sb
      .from("property_clusters")
      .insert({
        canonical_listing_id: canonical.id,
        listing_count: members.length,
        portals,
        fingerprint_struct: fp,
      })
      .select("id")
      .single();

    if (clusterErr) {
      console.error(`[dedup] Failed to create cluster: ${clusterErr.message}`);
      continue;
    }

    // Assign cluster_id to all members
    const memberIds = members.map((m) => m.id);
    const { error: updateErr } = await sb
      .from("listings")
      .update({ cluster_id: cluster.id })
      .in("id", memberIds);

    if (updateErr) {
      console.error(`[dedup] Failed to assign cluster: ${updateErr.message}`);
      continue;
    }

    clustered += members.length;
    newClusters++;
  }

  // ── Step 2: Geo fingerprint clustering (for remaining unclustered) ──
  const { data: geoUnclustered } = await sb
    .from("listings")
    .select(
      "id, title, description, lat, lng, price_mxn, price_usd, area_m2, bedrooms, bathrooms, images, address, last_seen_at, source_portal, fingerprint_struct, fingerprint_geo, cluster_id",
    )
    .eq("is_active", true)
    .is("cluster_id", null)
    .not("fingerprint_geo", "is", null);

  if (geoUnclustered && geoUnclustered.length > 0) {
    const geoGroups = new Map<string, ListingRow[]>();
    for (const row of geoUnclustered as ListingRow[]) {
      if (!row.fingerprint_geo) continue;
      const group = geoGroups.get(row.fingerprint_geo) ?? [];
      group.push(row);
      geoGroups.set(row.fingerprint_geo, group);
    }

    for (const [, members] of geoGroups) {
      if (members.length < 2) continue;

      // Price proximity check: all prices must be within 15% of each other
      const prices = members
        .map(
          (m) => m.price_mxn ?? (m.price_usd ? m.price_usd * USD_TO_MXN : null),
        )
        .filter((p): p is number => p != null);

      if (prices.length >= 2) {
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        if (maxP / minP > 1.15) continue; // Price spread too large
      }

      const sorted = members.sort((a, b) => {
        const scoreDiff = completenessScore(b) - completenessScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
      });
      const canonical = sorted[0];
      const portals = [...new Set(members.map((m) => m.source_portal))];

      const { data: cluster, error: clusterErr } = await sb
        .from("property_clusters")
        .insert({
          canonical_listing_id: canonical.id,
          listing_count: members.length,
          portals,
          fingerprint_struct: canonical.fingerprint_struct,
        })
        .select("id")
        .single();

      if (clusterErr) continue;

      const memberIds = members.map((m) => m.id);
      const { error: updateErr } = await sb
        .from("listings")
        .update({ cluster_id: cluster.id })
        .in("id", memberIds);

      if (updateErr) continue;

      clustered += members.length;
      newClusters++;
    }
  }

  return { clustered, newClusters };
}
