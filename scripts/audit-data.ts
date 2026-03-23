#!/usr/bin/env node
/**
 * Data Audit Script — validates all zone × operation × category combos
 *
 * Catches: inflated tickets, wrong price/m², cross-category contamination,
 * nonsensical KPIs that would otherwise only be found by browsing the app.
 *
 * Usage:
 *   npm run audit
 *   npx tsx scripts/audit-data.ts
 *   npx tsx scripts/audit-data.ts --zone=centro --verbose
 */

import * as path from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { createClient } from "@supabase/supabase-js"
import {
  isValidListing,
  effectivePriceMxn,
  getPropertyCategory,
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
  LAND_TYPES,
  type PropertyCategory,
} from "../src/lib/data/normalize"
import type { PropertyType } from "../src/types/database"

// ─── Setup ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const args = process.argv.slice(2)
const verbose = args.includes("--verbose")
const zoneFilter = args.find((a) => a.startsWith("--zone="))?.split("=")[1]

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

type ListingRow = {
  id: string
  zone_id: string
  property_type: PropertyType
  listing_type: string
  price_mxn: number | null
  price_usd: number | null
  area_m2: number | null
  is_active: boolean
}

// ─── Helpers ───────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function formatMXN(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

// ─── Audit Logic ───────────────────────────────────────────────────

async function runAudit(): Promise<AuditResult[]> {
  console.log("\n🔍 Inmobiq Data Audit\n")
  console.log("Fetching zones and listings...\n")

  // Fetch all zones
  const { data: zones, error: zonesErr } = await supabase.from("zones").select("id, slug, name")
  if (zonesErr || !zones?.length) {
    console.error("❌ Failed to fetch zones:", zonesErr?.message)
    process.exit(1)
  }

  // Fetch all active listings
  const { data: listings, error: listingsErr } = await supabase
    .from("listings")
    .select("id, zone_id, property_type, listing_type, price_mxn, price_usd, area_m2, is_active")
    .eq("is_active", true)

  if (listingsErr) {
    console.error("❌ Failed to fetch listings:", listingsErr.message)
    process.exit(1)
  }

  const allListings = (listings as ListingRow[]).map((l) => ({
    ...l,
    price: effectivePriceMxn(l.price_mxn, l.price_usd) ?? 0,
  }))

  const results: AuditResult[] = []
  const operations = ["venta", "renta"] as const
  const categories: PropertyCategory[] = ["residencial", "comercial", "terreno"]

  const targetZones = zoneFilter
    ? zones.filter((z) => z.slug === zoneFilter)
    : zones

  if (zoneFilter && targetZones.length === 0) {
    console.error(`❌ Zone "${zoneFilter}" not found`)
    process.exit(1)
  }

  for (const zone of targetZones) {
    for (const op of operations) {
      for (const cat of categories) {
        const types = CATEGORY_TYPES[cat]
        const bounds = PRICE_BOUNDS[op][cat]
        const m2Bounds = PRICE_PER_M2_BOUNDS[op][cat]

        // Filter listings for this combo
        const comboListings = allListings.filter(
          (l) =>
            l.zone_id === zone.id &&
            l.listing_type === op &&
            types.includes(l.property_type) &&
            l.price > 0
        )

        // Valid listings (pass isValidListing)
        const validListings = comboListings.filter((l) =>
          isValidListing(l.property_type, l.listing_type, l.price, l.area_m2 ?? null).isValid
        )

        // Count invalid
        const invalidCount = comboListings.length - validListings.length
        const invalidPct = comboListings.length > 0
          ? Math.round((invalidCount / comboListings.length) * 100)
          : 0

        if (comboListings.length === 0) {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "data_exists", status: "SKIP",
            detail: "No listings for this combo",
          })
          continue
        }

        // ── Check 1: Invalid listing ratio ──
        if (invalidPct > 30) {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "invalid_ratio", status: "WARN",
            detail: `${invalidCount}/${comboListings.length} (${invalidPct}%) listings fail validation`,
          })
        } else {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "invalid_ratio", status: "PASS",
            detail: `${invalidCount}/${comboListings.length} (${invalidPct}%) invalid`,
          })
        }

        if (validListings.length === 0) continue

        // ── Check 2: Median ticket in bounds ──
        const prices = validListings.map((l) => l.price)
        const medianTicket = median(prices)

        if (medianTicket < bounds.min || medianTicket > bounds.max) {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "ticket_in_bounds", status: "FAIL",
            detail: `Median ticket ${formatMXN(medianTicket)} outside [${formatMXN(bounds.min)}, ${formatMXN(bounds.max)}]`,
          })
        } else {
          results.push({
            zone: zone.slug, operation: op, category: cat,
            check: "ticket_in_bounds", status: "PASS",
            detail: `Median ticket ${formatMXN(medianTicket)}`,
          })
        }

        // ── Check 3: Median price/m² in bounds ──
        const withArea = validListings.filter((l) => (l.area_m2 ?? 0) > 0)
        if (withArea.length > 0) {
          const pricesPerM2 = withArea.map((l) => l.price / l.area_m2!)
          const medianPriceM2 = median(pricesPerM2)

          if (medianPriceM2 < m2Bounds.min || medianPriceM2 > m2Bounds.max) {
            results.push({
              zone: zone.slug, operation: op, category: cat,
              check: "price_m2_in_bounds", status: "FAIL",
              detail: `Median price/m² ${formatMXN(medianPriceM2)} outside [${formatMXN(m2Bounds.min)}, ${formatMXN(m2Bounds.max)}]`,
            })
          } else {
            results.push({
              zone: zone.slug, operation: op, category: cat,
              check: "price_m2_in_bounds", status: "PASS",
              detail: `Median price/m² ${formatMXN(medianPriceM2)}`,
            })
          }

          // ── Check 4: Ticket vs price/m² consistency ──
          // If median area exists, ticket ≈ price_m² × area (within 3x tolerance)
          const medianArea = median(withArea.map((l) => l.area_m2!))
          if (medianArea > 0) {
            const impliedTicket = medianPriceM2 * medianArea
            const ratio = medianTicket / impliedTicket
            if (ratio < 0.33 || ratio > 3) {
              results.push({
                zone: zone.slug, operation: op, category: cat,
                check: "ticket_vs_m2_consistency", status: "WARN",
                detail: `Ticket ${formatMXN(medianTicket)} vs implied ${formatMXN(impliedTicket)} (${medianArea.toFixed(0)}m² × ${formatMXN(medianPriceM2)}/m²) — ratio ${ratio.toFixed(2)}`,
              })
            } else {
              results.push({
                zone: zone.slug, operation: op, category: cat,
                check: "ticket_vs_m2_consistency", status: "PASS",
                detail: `Ratio ${ratio.toFixed(2)}`,
              })
            }
          }
        }

        // ── Check 5: Snapshot vs listing divergence ──
        // (would need snapshot data — skip for now, can add later)
      }
    }
  }

  return results
}

// ─── Report ────────────────────────────────────────────────────────

function printReport(results: AuditResult[]) {
  const fails = results.filter((r) => r.status === "FAIL")
  const warns = results.filter((r) => r.status === "WARN")
  const passes = results.filter((r) => r.status === "PASS")
  const skips = results.filter((r) => r.status === "SKIP")

  // Print failures
  if (fails.length > 0) {
    console.log("\n❌ FAILURES\n")
    for (const f of fails) {
      console.log(`  ${f.zone} | ${f.operation}/${f.category} | ${f.check}`)
      console.log(`    → ${f.detail}\n`)
    }
  }

  // Print warnings
  if (warns.length > 0) {
    console.log("\n⚠️  WARNINGS\n")
    for (const w of warns) {
      console.log(`  ${w.zone} | ${w.operation}/${w.category} | ${w.check}`)
      console.log(`    → ${w.detail}\n`)
    }
  }

  // Verbose: print all passes
  if (verbose && passes.length > 0) {
    console.log("\n✅ PASSES\n")
    for (const p of passes) {
      console.log(`  ${p.zone} | ${p.operation}/${p.category} | ${p.check} → ${p.detail}`)
    }
  }

  // Summary
  console.log("\n" + "═".repeat(60))
  console.log(`  ✅ ${passes.length} passed  |  ❌ ${fails.length} failed  |  ⚠️  ${warns.length} warnings  |  ⏭  ${skips.length} skipped`)
  console.log("═".repeat(60) + "\n")

  if (fails.length > 0) {
    console.log("💡 Fix: ensure getZoneMetrics() applies isValidListing() to all price calculations.\n")
    process.exit(1)
  }
}

// ─── Main ──────────────────────────────────────────────────────────

runAudit()
  .then(printReport)
  .catch((err) => {
    console.error("❌ Audit failed:", err)
    process.exit(1)
  })
