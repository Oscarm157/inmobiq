import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { rateLimit } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  isValidListing,
  effectivePriceMxn,
  getPropertyCategory,
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
  LAND_TYPES,
  type PropertyCategory,
} from "@/lib/data/normalize"
import type { PropertyType } from "@/types/database"

export const maxDuration = 30

// ─── Price bounds (must match normalize.ts) ────────────────────────

const PRICE_BOUNDS: Record<string, Record<PropertyCategory, { min: number; max: number }>> = {
  venta: {
    residencial: { min: 300_000, max: 50_000_000 },
    comercial: { min: 200_000, max: 100_000_000 },
    terreno: { min: 100_000, max: 80_000_000 },
  },
  renta: {
    residencial: { min: 3_000, max: 150_000 },
    comercial: { min: 3_000, max: 500_000 },
    terreno: { min: 1_000, max: 200_000 },
  },
}

const PRICE_PER_M2_BOUNDS: Record<string, Record<PropertyCategory, { min: number; max: number }>> = {
  venta: {
    residencial: { min: 3_000, max: 200_000 },
    comercial: { min: 5_000, max: 300_000 },
    terreno: { min: 1_000, max: 100_000 },
  },
  renta: {
    residencial: { min: 30, max: 2_000 },
    comercial: { min: 30, max: 5_000 },
    terreno: { min: 5, max: 1_000 },
  },
}

const CATEGORY_TYPES: Record<PropertyCategory, PropertyType[]> = {
  residencial: RESIDENTIAL_TYPES,
  comercial: COMMERCIAL_TYPES,
  terreno: LAND_TYPES,
}

// ─── Types ─────────────────────────────────────────────────────────

interface AuditResult {
  zone: string
  operation: string
  category: string
  check: string
  status: "PASS" | "FAIL" | "WARN" | "SKIP"
  detail: string
}

// ─── Helpers ───────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

// ─── GET /api/admin/audit ──────────────────────────────────────────

export async function GET() {
  const check = await verifyAdmin()
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const limited = await rateLimit(`admin-audit:${check.userId}`, 5, 60_000)
  if (limited) return limited

  const supabase = await createSupabaseServerClient()

  // Fetch zones
  const zonesRes = await supabase.from("zones").select("id, slug, name")
  const zonesErr = zonesRes.error
  const zones = (zonesRes.data ?? []) as Array<{ id: string; slug: string; name: string }>
  if (zonesErr || zones.length === 0) {
    return NextResponse.json({ error: "Failed to fetch zones", detail: zonesErr?.message }, { status: 500 })
  }

  // Fetch active listings
  const listingsRes = await supabase
    .from("listings")
    .select("id, zone_id, property_type, listing_type, price_mxn, price_usd, area_m2, is_active")
    .eq("is_active", true)
  const listingsErr = listingsRes.error
  const rawListings = (listingsRes.data ?? []) as Array<{
    id: string; zone_id: string; property_type: string; listing_type: string
    price_mxn: number | null; price_usd: number | null; area_m2: number | null
  }>

  if (listingsErr) {
    return NextResponse.json({ error: "Failed to fetch listings", detail: listingsErr.message }, { status: 500 })
  }

  const allListings = rawListings.map((l) => ({
    ...l,
    price: effectivePriceMxn(l.price_mxn, l.price_usd) ?? 0,
  }))

  const results: AuditResult[] = []
  const operations = ["venta", "renta"] as const
  const categories: PropertyCategory[] = ["residencial", "comercial", "terreno"]

  for (const zone of zones) {
    for (const op of operations) {
      for (const cat of categories) {
        const types = CATEGORY_TYPES[cat]
        const bounds = PRICE_BOUNDS[op][cat]
        const m2Bounds = PRICE_PER_M2_BOUNDS[op][cat]

        const comboListings = allListings.filter(
          (l) =>
            l.zone_id === zone.id &&
            l.listing_type === op &&
            types.includes(l.property_type as PropertyType) &&
            l.price > 0
        )

        const validListings = comboListings.filter((l) =>
          isValidListing(l.property_type as PropertyType, l.listing_type, l.price, l.area_m2 ?? null).isValid
        )

        const invalidCount = comboListings.length - validListings.length
        const invalidPct = comboListings.length > 0
          ? Math.round((invalidCount / comboListings.length) * 100)
          : 0

        if (comboListings.length === 0) {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "data_exists", status: "SKIP",
            detail: `No listings`,
          })
          continue
        }

        // Check 1: Invalid listing ratio
        results.push({
          zone: zone.slug, operation: op, category: cat,
          check: "invalid_ratio",
          status: invalidPct > 30 ? "WARN" : "PASS",
          detail: `${invalidCount}/${comboListings.length} (${invalidPct}%) fail validation`,
        })

        if (validListings.length === 0) continue

        // Check 2: Median ticket in bounds
        const prices = validListings.map((l) => l.price)
        const medianTicket = median(prices)

        results.push({
          zone: zone.slug, operation: op, category: cat,
          check: "ticket_in_bounds",
          status: medianTicket < bounds.min || medianTicket > bounds.max ? "FAIL" : "PASS",
          detail: `Median ${fmt(medianTicket)} [${fmt(bounds.min)}–${fmt(bounds.max)}]`,
        })

        // Check 3: Median price/m² in bounds
        const withArea = validListings.filter((l) => (l.area_m2 ?? 0) > 0)
        if (withArea.length > 0) {
          const pricesPerM2 = withArea.map((l) => l.price / l.area_m2!)
          const medianPriceM2 = median(pricesPerM2)

          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "price_m2_in_bounds",
            status: medianPriceM2 < m2Bounds.min || medianPriceM2 > m2Bounds.max ? "FAIL" : "PASS",
            detail: `Median/m² ${fmt(medianPriceM2)} [${fmt(m2Bounds.min)}–${fmt(m2Bounds.max)}]`,
          })

          // Check 4: Ticket vs price/m² consistency
          const medianArea = median(withArea.map((l) => l.area_m2!))
          if (medianArea > 0) {
            const impliedTicket = medianPriceM2 * medianArea
            const ratio = medianTicket / impliedTicket

            results.push({
              zone: zone.slug, operation: op, category: cat,
              check: "ticket_vs_m2",
              status: ratio < 0.33 || ratio > 3 ? "WARN" : "PASS",
              detail: `Ticket/implied ratio ${ratio.toFixed(2)}`,
            })
          }
        }
      }
    }
  }

  // Summary
  const fails = results.filter((r) => r.status === "FAIL")
  const warns = results.filter((r) => r.status === "WARN")
  const passes = results.filter((r) => r.status === "PASS")
  const skips = results.filter((r) => r.status === "SKIP")

  return NextResponse.json({
    summary: {
      total: results.length,
      pass: passes.length,
      fail: fails.length,
      warn: warns.length,
      skip: skips.length,
      zones_audited: zones.length,
      listings_total: allListings.length,
    },
    failures: fails,
    warnings: warns,
    all: results,
  })
}
