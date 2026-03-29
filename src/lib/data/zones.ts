import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  TIJUANA_ZONES,
  TIJUANA_CITY_METRICS,
} from "@/lib/mock-data"
import type { Zone, Snapshot, CitySnapshot, ZoneMetrics, CityMetrics, PropertyType } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"
import { isValidListing, effectivePriceMxn, RESIDENTIAL_TYPES, COMMERCIAL_TYPES, LAND_TYPES, type PropertyCategory } from "@/lib/data/normalize"

const useMock = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

/** Resolve category filter into effective property types list */
function resolveTypesWithCategory(filters?: ListingFilters): PropertyType[] | undefined {
  const categoryTypes: Record<PropertyCategory, PropertyType[]> = {
    residencial: RESIDENTIAL_TYPES,
    comercial: COMMERCIAL_TYPES,
    terreno: LAND_TYPES,
  }
  if (filters?.categoria) {
    const catTypes = categoryTypes[filters.categoria]
    // If tipos also specified, intersect with category types
    if (filters.tipos?.length) {
      const intersection = filters.tipos.filter((t) => catTypes.includes(t))
      return intersection.length > 0 ? intersection : catTypes
    }
    return catTypes
  }
  return filters?.tipos?.length ? filters.tipos : undefined
}

/** Compute median of a numeric array (0 for empty arrays). */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Raw snapshot row as stored in Supabase (one row per zone+property_type+listing_type) */
interface RealSnapshot {
  zone_id: string;
  week_start: string;
  property_type: PropertyType;
  listing_type: string;
  count_active: number;
  avg_price: number;
  avg_price_per_m2: number;
}

export async function getZoneMetrics(filters?: ListingFilters): Promise<ZoneMetrics[]> {
  if (useMock()) {
    let zones = TIJUANA_ZONES
    // Apply zone filter to mock data
    if (filters?.zonas?.length) {
      zones = zones.filter((z) => filters.zonas!.includes(z.zone_slug))
    }
    // Apply property type / category filter: recalculate total_listings from listings_by_type
    const effectiveTypes = resolveTypesWithCategory(filters)
    if (effectiveTypes?.length) {
      zones = zones.map((z) => {
        const filteredTotal = effectiveTypes.reduce((sum, t) => sum + (z.listings_by_type[t] ?? 0), 0)
        return { ...z, total_listings: filteredTotal }
      }).filter((z) => z.total_listings > 0)
    }
    return zones
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Get the two most recent distinct snapshot weeks
    const weeksRes = await supabase
      .from("snapshots")
      .select("week_start")
      .order("week_start", { ascending: false })
      .limit(20) // fetch enough to find 2 distinct weeks

    const allWeeks = weeksRes.data as Array<{ week_start: string }> | null
    if (!allWeeks?.length) return TIJUANA_ZONES

    const distinctWeeks = [...new Set(allWeeks.map((w) => w.week_start))]
    const latestWeek = distinctWeeks[0]
    const prevWeek = distinctWeeks[1] ?? null

    // Build filtered listings query
    let listingsQuery = supabase
      .from("listings")
      .select("zone_id, price_mxn, price_usd, area_m2, property_type, listing_type")
      .eq("is_active", true)
      .or("price_mxn.gt.0,price_usd.gt.0")
      .gt("area_m2", 10)
      .lt("area_m2", 50000)

    // Build filtered snapshots query
    let latestSnapsQuery = supabase
      .from("snapshots")
      .select("zone_id, week_start, property_type, listing_type, count_active, avg_price, avg_price_per_m2")
      .eq("week_start", latestWeek)

    // Apply filters (resolve category into property types)
    const effectiveTypes = resolveTypesWithCategory(filters)
    if (effectiveTypes?.length) {
      listingsQuery = listingsQuery.in("property_type", effectiveTypes)
      latestSnapsQuery = latestSnapsQuery.in("property_type", effectiveTypes)
    }
    if (filters?.listing_type) {
      listingsQuery = listingsQuery.eq("listing_type", filters.listing_type)
      latestSnapsQuery = latestSnapsQuery.eq("listing_type", filters.listing_type)
    }
    // Price filters applied post-fetch after USD→MXN conversion
    if (filters?.area_min != null) listingsQuery = listingsQuery.gte("area_m2", filters.area_min)
    if (filters?.area_max != null) listingsQuery = listingsQuery.lte("area_m2", filters.area_max)
    if (filters?.recamaras?.length) {
      const has4plus = filters.recamaras.includes(4)
      const exact = filters.recamaras.filter((r) => r < 4)
      if (has4plus && exact.length) {
        listingsQuery = listingsQuery.or(`bedrooms.gte.4,bedrooms.in.(${exact.join(",")})`)
      } else if (has4plus) {
        listingsQuery = listingsQuery.gte("bedrooms", 4)
      } else {
        listingsQuery = listingsQuery.in("bedrooms", exact)
      }
    }

    // Resolve zone filter to IDs
    let filterZoneIds: string[] | null = null
    if (filters?.zonas?.length) {
      const { data: zoneRows } = await supabase
        .from("zones")
        .select("id")
        .in("slug", filters.zonas)
      filterZoneIds = (zoneRows ?? []).map((z: { id: string }) => z.id)
      if (filterZoneIds.length) {
        listingsQuery = listingsQuery.in("zone_id", filterZoneIds)
        latestSnapsQuery = latestSnapsQuery.in("zone_id", filterZoneIds)
      }
    }

    // Type distribution query: ignores category (property_type) filter but respects operacion (listing_type)
    let typeDistribSnapsQuery = supabase
      .from("snapshots")
      .select("zone_id, property_type, listing_type, count_active")
      .eq("week_start", latestWeek)
    if (filters?.listing_type) {
      typeDistribSnapsQuery = typeDistribSnapsQuery.eq("listing_type", filters.listing_type)
    }
    if (filterZoneIds?.length) {
      typeDistribSnapsQuery = typeDistribSnapsQuery.in("zone_id", filterZoneIds)
    }

    // Fetch zones, snapshots, and individual listings in parallel
    const [zonesRes, latestSnapsRes, prevSnapsRes, listingsRes, typeDistribSnapsRes] = await Promise.all([
      supabase.from("zones").select("*"),
      latestSnapsQuery,
      prevWeek
        ? supabase
            .from("snapshots")
            .select("zone_id, avg_price_per_m2, count_active")
            .eq("week_start", prevWeek)
        : Promise.resolve({ data: [] }),
      listingsQuery,
      typeDistribSnapsQuery,
    ])

    const zones = zonesRes.data as Zone[] | null
    const latestSnaps = latestSnapsRes.data as RealSnapshot[] | null
    const prevSnaps = prevSnapsRes.data as Array<{ zone_id: string; avg_price_per_m2: number; count_active: number }> | null
    const listingsDataRaw = listingsRes.data as Array<{ zone_id: string; price_mxn: number | null; price_usd: number | null; area_m2: number; property_type: PropertyType; listing_type: string }> | null
    const typeDistribSnaps = typeDistribSnapsRes.data as Array<{ zone_id: string; property_type: string; listing_type: string; count_active: number }> | null

    // Add effective price (USD→MXN converted) and normalize
    const listingsData = listingsDataRaw?.map((l) => ({
      ...l,
      price: effectivePriceMxn(l.price_mxn, l.price_usd) ?? 0,
    })).filter((l) => {
      if (l.price <= 0) return false
      if (!isValidListing(l.property_type, l.listing_type, l.price, l.area_m2).isValid) return false
      if (filters?.precio_min != null && l.price < filters.precio_min) return false
      if (filters?.precio_max != null && l.price > filters.precio_max) return false
      return true
    }) ?? null

    if (!zones?.length || !latestSnaps?.length) {
      // Apply basic filters to mock fallback
      let fallback = TIJUANA_ZONES
      if (filters?.zonas?.length) {
        fallback = fallback.filter((z) => filters.zonas!.includes(z.zone_slug))
      }
      const fbTypes = resolveTypesWithCategory(filters)
      if (fbTypes?.length) {
        fallback = fallback.map((z) => {
          const filteredTotal = fbTypes.reduce((sum, t) => sum + (z.listings_by_type[t] ?? 0), 0)
          return { ...z, total_listings: filteredTotal }
        }).filter((z) => z.total_listings > 0)
      }
      return fallback
    }

    // Build median price/m² and median ticket lookups from validated individual listings
    const medianPriceByZone = new Map<string, number>()
    const medianTicketByZone = new Map<string, number>()
    const medianTicketByZoneType = new Map<string, number>() // key: "zoneId::propertyType"
    if (listingsData?.length) {
      const grouped = new Map<string, number[]>()
      const ticketGrouped = new Map<string, number[]>()
      const ticketByTypeGrouped = new Map<string, number[]>()
      for (const l of listingsData) {
        if (l.price > 0) {
          // Ticket (absolute price)
          const tArr = ticketGrouped.get(l.zone_id) ?? []
          tArr.push(l.price)
          ticketGrouped.set(l.zone_id, tArr)

          // Ticket by type
          const typeKey = `${l.zone_id}::${l.property_type}`
          const ttArr = ticketByTypeGrouped.get(typeKey) ?? []
          ttArr.push(l.price)
          ticketByTypeGrouped.set(typeKey, ttArr)

          // Price per m²
          if (l.area_m2 > 0) {
            const arr = grouped.get(l.zone_id) ?? []
            arr.push(l.price / l.area_m2)
            grouped.set(l.zone_id, arr)
          }
        }
      }
      for (const [zoneId, values] of grouped) {
        medianPriceByZone.set(zoneId, Math.round(median(values)))
      }
      for (const [zoneId, values] of ticketGrouped) {
        medianTicketByZone.set(zoneId, Math.round(median(values)))
      }
      for (const [key, values] of ticketByTypeGrouped) {
        medianTicketByZoneType.set(key, Math.round(median(values)))
      }
    }

    // Aggregate snapshots per zone
    const result: ZoneMetrics[] = zones
      .map((zone) => {
        const zoneSnaps = latestSnaps.filter((s) => s.zone_id === zone.id)
        if (!zoneSnaps.length) return null

        // Sum count_active across all property_type/listing_type combos
        const totalListings = zoneSnaps.reduce((sum, s) => sum + Number(s.count_active), 0)

        // Weighted avg price per m2 (fallback when no listings available)
        const totalWeighted = zoneSnaps.reduce(
          (sum, s) => sum + Number(s.avg_price_per_m2) * Number(s.count_active), 0
        )
        const snapshotAvgPricePerM2 = totalListings > 0 ? totalWeighted / totalListings : 0

        // Use median from listings for consistency with analytics pages
        const avgPricePerM2 = medianPriceByZone.get(zone.id) ?? Math.round(snapshotAvgPricePerM2)

        // Avg ticket: prefer validated listing median, fallback to snapshot avg_price
        const snapshotTicket = (() => {
          const totalTicket = zoneSnaps.reduce(
            (sum, s) => sum + Number(s.avg_price) * Number(s.count_active), 0
          )
          return totalListings > 0 ? totalTicket / totalListings : 0
        })()
        const avgTicket = medianTicketByZone.get(zone.id) ?? Math.round(snapshotTicket)

        // listings_by_type: aggregate from type distribution snapshots (all property types, but respects operacion)
        // so the distribution always shows all types regardless of category filter
        const listingsByType: Record<string, number> = {}
        const unfilteredZoneSnaps = typeDistribSnaps?.filter((s) => s.zone_id === zone.id) ?? []
        for (const s of unfilteredZoneSnaps) {
          listingsByType[s.property_type] = (listingsByType[s.property_type] ?? 0) + Number(s.count_active)
        }
        // Ticket by type still uses filtered snapshots (for pricing relevance)
        const snapshotTicketByType: Record<string, number> = {}
        for (const s of zoneSnaps) {
          const pt = s.property_type
          const existing = snapshotTicketByType[pt] ?? 0
          snapshotTicketByType[pt] = existing + Number(s.avg_price) * Number(s.count_active)
        }
        // Normalize snapshot ticket by type (used as fallback) — use filtered snap counts for ticket
        const filteredCountByType: Record<string, number> = {}
        for (const s of zoneSnaps) {
          filteredCountByType[s.property_type] = (filteredCountByType[s.property_type] ?? 0) + Number(s.count_active)
        }
        for (const pt of Object.keys(snapshotTicketByType)) {
          const count = filteredCountByType[pt] ?? 1
          snapshotTicketByType[pt] = count > 0 ? snapshotTicketByType[pt] / count : 0
        }
        // Prefer validated listing median per type, fallback to snapshot
        const ticketByType: Record<string, number> = {}
        for (const pt of Object.keys(listingsByType)) {
          const typeKey = `${zone.id}::${pt}`
          ticketByType[pt] = medianTicketByZoneType.get(typeKey) ?? Math.round(snapshotTicketByType[pt] ?? 0)
        }

        // Price trend vs previous week
        const prevZoneSnaps = prevSnaps?.filter((s) => s.zone_id === zone.id) ?? []
        let priceTrend = 0
        if (prevZoneSnaps.length > 0) {
          const prevTotal = prevZoneSnaps.reduce((s, p) => s + Number(p.count_active), 0)
          const prevWeighted = prevZoneSnaps.reduce(
            (s, p) => s + Number(p.avg_price_per_m2) * Number(p.count_active), 0
          )
          const prevAvg = prevTotal > 0 ? prevWeighted / prevTotal : 0
          if (prevAvg > 0) {
            priceTrend = ((avgPricePerM2 - prevAvg) / prevAvg) * 100
          }
        }

        return {
          zone_id: zone.id,
          zone_name: zone.name,
          zone_slug: zone.slug,
          avg_price_per_m2: avgPricePerM2,
          price_trend_pct: Number(priceTrend.toFixed(1)),
          avg_ticket: Math.round(avgTicket),
          total_listings: totalListings,
          listings_by_type: listingsByType as Record<PropertyType, number>,
          avg_ticket_by_type: ticketByType as Record<PropertyType, number>,
        } satisfies ZoneMetrics
      })
      .filter(Boolean) as ZoneMetrics[]

    if (result.length === 0) return filters?.zonas?.length ? [] : TIJUANA_ZONES

    // Filter output zones if zone filter active
    if (filterZoneIds?.length) {
      return result.filter((z) => filterZoneIds!.includes(z.zone_id))
    }
    return result
  } catch {
    return TIJUANA_ZONES
  }
}

export async function getZoneBySlug(slug: string, filters?: ListingFilters): Promise<ZoneMetrics | null> {
  const zones = await getZoneMetrics(filters)
  return zones.find((z) => z.zone_slug === slug) ?? null
}

export async function getCityMetrics(filters?: ListingFilters): Promise<CityMetrics> {
  const zones = await getZoneMetrics(filters)

  const hasFilters = filters && (
    (filters.tipos?.length ?? 0) > 0 || !!filters.listing_type || !!filters.categoria ||
    (filters.zonas?.length ?? 0) > 0 || filters.precio_min != null ||
    filters.precio_max != null || filters.area_min != null ||
    filters.area_max != null || (filters.recamaras?.length ?? 0) > 0
  )

  if (!hasFilters && (useMock() || zones === TIJUANA_ZONES)) {
    return TIJUANA_CITY_METRICS
  }

  // When filters are active, compute city metrics from filtered zones
  if (hasFilters) {
    const totalListings = zones.reduce((s, z) => s + z.total_listings, 0)
    // Use median of zone prices (weighted by listing count) for robustness against outliers
    const zonePrices = zones
      .filter((z) => z.avg_price_per_m2 > 0 && z.total_listings > 0)
      .flatMap((z) => Array(Math.min(z.total_listings, 100)).fill(z.avg_price_per_m2) as number[])
      .sort((a, b) => a - b)
    const mid = Math.floor(zonePrices.length / 2)
    const avgPricePerM2 = zonePrices.length > 0
      ? Math.round(zonePrices.length % 2 !== 0 ? zonePrices[mid] : (zonePrices[mid - 1] + zonePrices[mid]) / 2)
      : 0

    const sortedByPrice = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
    const sortedByListings = [...zones].sort((a, b) => b.total_listings - a.total_listings)

    return {
      city: "Tijuana",
      avg_price_per_m2: avgPricePerM2,
      price_trend_pct: zones.length > 0
        ? Number((zones.reduce((s, z) => s + z.price_trend_pct, 0) / zones.length).toFixed(1))
        : 0,
      total_listings: totalListings,
      total_zones: zones.length,
      top_zones: sortedByPrice.slice(0, 4),
      hottest_zones: sortedByListings.slice(0, 4),
    }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const citySnapsRes = await supabase
      .from("city_snapshots")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(2)

    const latestCity = citySnapsRes.data as Array<{
      id: string; city: string; week_start: string;
      avg_price_per_m2: number; count_active: number; total_zones: number;
    }> | null

    if (!latestCity?.length) return TIJUANA_CITY_METRICS

    const [latest, prev] = latestCity
    const priceTrend = prev && Number(prev.avg_price_per_m2) > 0
      ? ((Number(latest.avg_price_per_m2) - Number(prev.avg_price_per_m2)) /
          Number(prev.avg_price_per_m2)) *
        100
      : 0

    const sortedByPrice = [...zones].sort(
      (a, b) => b.avg_price_per_m2 - a.avg_price_per_m2
    )
    const sortedByListings = [...zones].sort(
      (a, b) => b.total_listings - a.total_listings
    )

    return {
      city: latest.city ?? "Tijuana",
      avg_price_per_m2: Number(latest.avg_price_per_m2),
      price_trend_pct: Number(priceTrend.toFixed(1)),
      total_listings: latest.count_active ?? 0,
      total_zones: latest.total_zones ?? zones.length,
      top_zones: sortedByPrice.slice(0, 4),
      hottest_zones: sortedByListings.slice(0, 4),
    }
  } catch {
    return TIJUANA_CITY_METRICS
  }
}

/** Returns the ISO date of the most recent snapshot (for "last updated" UI). */
export async function getLastSnapshotDate(): Promise<string | null> {
  if (useMock()) return null
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("snapshots")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    return (data as { created_at: string } | null)?.created_at ?? null
  } catch {
    return null
  }
}
