#!/usr/bin/env node
/**
 * Import existing Apify Inmuebles24 run results into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-apify-runs.ts
 */

import * as path from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { ApifyClient } from "apify-client"
import { mapToRawListing, type ApifyI24Listing } from "../src/scraper/adapters/inmuebles24"
import {
  getZones,
  createScraperRun,
  finalizeScraperRun,
  upsertListings,
} from "../src/scraper/db"
import { runDedup } from "../src/scraper/dedup"
import { calculateWeeklySnapshots } from "../src/scraper/snapshots"

// ─── Run IDs to import ──────────────────────────────────────────────────────

const RUN_IDS = [
  "LoNXfD054q7aD61X2",
  "V6Y4Qi74nrEUQDs3d",
  "U7KxqZTHw1gCPtmEk",
  "CWoWGUPo7vjWQapv9",
]

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    console.error("APIFY_API_TOKEN not set")
    process.exit(1)
  }

  const client = new ApifyClient({ token })
  const zones = await getZones()
  console.log(`Loaded ${zones.length} zones`)

  let totalNew = 0
  let totalUpdated = 0
  let totalFound = 0

  for (const runId of RUN_IDS) {
    console.log(`\n── Importing run ${runId} ──`)

    try {
      // Get run info
      const run = await client.run(runId).get()
      if (!run) {
        console.log(`  Run not found, skipping`)
        continue
      }
      console.log(`  Status: ${run.status}, started: ${run.startedAt}`)

      if (run.status !== "SUCCEEDED") {
        console.log(`  Skipping (not SUCCEEDED)`)
        continue
      }

      // Fetch dataset items
      const { items } = await client.dataset(run.defaultDatasetId).listItems()
      console.log(`  Dataset: ${items.length} items`)

      if (items.length === 0) {
        console.log(`  Empty dataset, skipping`)
        continue
      }

      // Map to RawListing
      const listings = (items as ApifyI24Listing[]).map(mapToRawListing)
      console.log(`  Mapped: ${listings.length} listings`)

      // Create scraper run record
      const scraperRunId = await createScraperRun("inmuebles24")

      // Upsert into Supabase
      const stats = await upsertListings(listings, zones)
      console.log(`  Results: ${stats.found} found, ${stats.new_} new, ${stats.updated} updated, ${stats.zoneAssigned} with zone`)

      totalFound += stats.found
      totalNew += stats.new_
      totalUpdated += stats.updated

      // Finalize run record
      await finalizeScraperRun(scraperRunId, {
        status: "completed",
        listings_found: stats.found,
        listings_new: stats.new_,
        listings_updated: stats.updated,
        errors: [],
      })
    } catch (err) {
      console.error(`  Error importing run ${runId}:`, err)
    }
  }

  console.log(`\n── Import summary ──`)
  console.log(`  Total: ${totalFound} found, ${totalNew} new, ${totalUpdated} updated`)

  // Post-import: dedup + snapshots
  console.log(`\n── Running dedup...`)
  try {
    const dedupResult = await runDedup()
    console.log(`  Dedup: ${dedupResult.clustersCreated} clusters created`)
  } catch (err) {
    console.error(`  Dedup error:`, err)
  }

  console.log(`\n── Calculating snapshots...`)
  try {
    const snapResult = await calculateWeeklySnapshots()
    console.log(`  Snapshots: ${snapResult.zoneSnapshots} zone, ${snapResult.citySnapshots} city`)
  } catch (err) {
    console.error(`  Snapshot error:`, err)
  }

  console.log(`\nDone!`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
