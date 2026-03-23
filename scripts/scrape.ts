#!/usr/bin/env node
/**
 * Inmobiq Scraper CLI
 *
 * Usage:
 *   npx tsx scripts/scrape.ts [options]
 *
 * Options:
 *   --portal=<all|inmuebles24|lamudi|vivanuncios|mercadolibre>  (default: all)
 *   --pages=<n>                                                 (default: 5)
 *   --listing-type=<venta|renta|all>                            (default: all)
 *   --property-type=<casa|departamento|terreno|local|oficina>   (optional)
 *   --no-snapshots                                              Skip snapshot calculation
 *   --dry-run                                                   Print listings without saving
 */

import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import type { SourcePortal, ListingType, PropertyType } from "../src/types/database";
import type { ScraperAdapter, ScraperConfig, ScraperError } from "../src/scraper/types";
import { inmuebles24Adapter } from "../src/scraper/adapters/inmuebles24";
import { lamudiAdapter } from "../src/scraper/adapters/lamudi";
import { vivanunciosAdapter } from "../src/scraper/adapters/vivanuncios";
import { mercadolibreAdapter } from "../src/scraper/adapters/mercadolibre";
import {
  getZones,
  createScraperRun,
  finalizeScraperRun,
  upsertListings,
  deactivateStaleListings,
} from "../src/scraper/db";
import { calculateWeeklySnapshots } from "../src/scraper/snapshots";
import { runDedup } from "../src/scraper/dedup";
import { closeBrowser } from "../src/scraper/browser";

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  portals: SourcePortal[];
  pages: number;
  listingType: ListingType | undefined;
  propertyType: PropertyType | undefined;
  noSnapshots: boolean;
  dryRun: boolean;
} {
  const args = argv.slice(2);
  const get = (key: string) => {
    const arg = args.find((a) => a.startsWith(`--${key}=`));
    return arg ? arg.split("=").slice(1).join("=") : null;
  };
  const has = (key: string) => args.includes(`--${key}`);

  const portalArg = get("portal") ?? "all";
  const allPortals: SourcePortal[] = ["inmuebles24", "lamudi", "vivanuncios", "mercadolibre"];
  const portals: SourcePortal[] =
    portalArg === "all" ? allPortals : ([portalArg] as SourcePortal[]);

  const pages = parseInt(get("pages") ?? "5", 10);

  const ltArg = get("listing-type") ?? "all";
  const listingType: ListingType | undefined =
    ltArg === "all" ? undefined : (ltArg as ListingType);

  const ptArg = get("property-type");
  const propertyType: PropertyType | undefined = ptArg ? (ptArg as PropertyType) : undefined;

  return {
    portals,
    pages: isNaN(pages) ? 5 : pages,
    listingType,
    propertyType,
    noSnapshots: has("no-snapshots"),
    dryRun: has("dry-run"),
  };
}

// ─── Adapter Map ─────────────────────────────────────────────────────────────

const ADAPTERS: Record<SourcePortal, ScraperAdapter> = {
  inmuebles24: inmuebles24Adapter,
  lamudi: lamudiAdapter,
  vivanuncios: vivanunciosAdapter,
  mercadolibre: mercadolibreAdapter,
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function runScraper(portal: SourcePortal, config: ScraperConfig, dryRun: boolean) {
  const adapter = ADAPTERS[portal];
  const startMs = Date.now();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[scraper] Starting ${portal} (pages=${config.pages})`);
  console.log(`${"=".repeat(60)}`);

  let runId: string | null = null;
  const errors: ScraperError[] = [];

  try {
    if (!dryRun) {
      runId = await createScraperRun(portal);
      console.log(`[scraper] Run ID: ${runId}`);
    }

    // Scrape
    const listings = await adapter.scrape(config);
    console.log(`[scraper] ${portal}: scraped ${listings.length} total listings`);

    if (dryRun) {
      console.log(`[dry-run] Sample listing:`, JSON.stringify(listings[0], null, 2));
      console.log(`[dry-run] Total: ${listings.length} listings — not saved`);
      return;
    }

    // Check error rate
    const errorRate = errors.length / Math.max(listings.length, 1);
    if (errorRate > 0.5) {
      console.warn(`[scraper] High error rate (${(errorRate * 100).toFixed(1)}%) for ${portal}`);
    }

    // Fetch zones and upsert
    const zones = await getZones();
    const stats = await upsertListings(listings, zones);

    console.log(
      `[scraper] ${portal}: found=${stats.found}, new=${stats.new_}, ` +
        `updated=${stats.updated}, zone_assigned=${stats.zoneAssigned}`
    );

    const zoneAssignmentPct = stats.found > 0 ? (stats.zoneAssigned / stats.found) * 100 : 0;
    if (zoneAssignmentPct < 80 && stats.found > 0) {
      console.warn(
        `[scraper] Zone assignment below 80%: ${zoneAssignmentPct.toFixed(1)}% for ${portal}`
      );
    }

    // Deactivate stale listings (scoped to listing_type to avoid cross-contamination)
    const deactivated = await deactivateStaleListings(portal, config.listing_type);
    if (deactivated > 0) {
      console.log(`[scraper] Deactivated ${deactivated} stale ${config.listing_type ?? "all"} listings for ${portal}`);
    }

    // Finalize run
    if (runId) {
      await finalizeScraperRun(runId, {
        status: "completed",
        listings_found: stats.found,
        listings_new: stats.new_,
        listings_updated: stats.updated,
        errors,
      });
    }

    const durationMs = Date.now() - startMs;
    console.log(`[scraper] ${portal} completed in ${(durationMs / 1_000).toFixed(1)}s`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scraper] ${portal} FAILED: ${msg}`);

    if (runId) {
      await finalizeScraperRun(runId, {
        status: "failed",
        listings_found: 0,
        listings_new: 0,
        listings_updated: 0,
        errors: [
          ...errors,
          { portal, url: null, error_type: "fatal", error_message: msg },
        ],
      });
    }

    throw err;
  }
}

async function main() {
  const { portals, pages, listingType, propertyType, noSnapshots, dryRun } = parseArgs(
    process.argv
  );

  console.log(`
╔════════════════════════════════════════╗
║      Inmobiq Scraper — Tijuana         ║
╚════════════════════════════════════════╝
Portals : ${portals.join(", ")}
Pages   : ${pages}
LType   : ${listingType ?? "all"}
PType   : ${propertyType ?? "all"}
DryRun  : ${dryRun}
Snapshots: ${!noSnapshots}
  `);

  if (!dryRun) {
    // Validate Supabase connectivity early
    try {
      const zones = await getZones();
      console.log(`[scraper] Connected to Supabase — ${zones.length} zones loaded`);
      if (!zones.length) {
        console.warn(
          "[scraper] No zones found. Run migrations 001_base_schema.sql first."
        );
      }
    } catch (err) {
      console.error(`[scraper] Supabase connection failed: ${err}`);
      process.exit(1);
    }
  }

  const config: ScraperConfig = {
    portal: portals[0], // will be overridden per portal
    pages,
    listing_type: listingType,
    property_type: propertyType,
  };

  let hasErrors = false;
  for (const portal of portals) {
    try {
      await runScraper(portal, { ...config, portal }, dryRun);
    } catch {
      hasErrors = true;
      console.error(`[scraper] ${portal} failed — continuing with remaining portals`);
    }
  }

  // Post-scrape: deduplicate listings
  if (!dryRun) {
    try {
      console.log("\n[dedup] Running deduplication…");
      const { clustered, newClusters } = await runDedup();
      console.log(
        `[dedup] ${clustered} listings clustered into ${newClusters} property groups`
      );
    } catch (err) {
      console.error(`[dedup] Failed: ${err}`);
      hasErrors = true;
    }
  }

  // Post-scrape: calculate snapshots
  if (!dryRun && !noSnapshots) {
    try {
      console.log("\n[snapshots] Calculating weekly snapshots…");
      const { zoneSnapshots, citySnapshots } = await calculateWeeklySnapshots();
      console.log(
        `[snapshots] Done: ${zoneSnapshots} zone snapshots, ${citySnapshots} city snapshots`
      );
    } catch (err) {
      console.error(`[snapshots] Failed: ${err}`);
      hasErrors = true;
    }
  }

  // Close browser
  await closeBrowser();
  console.log("\n✅ Scraper run complete");
  process.exit(hasErrors ? 1 : 0);
}

main().catch(async (err) => {
  console.error("[scraper] Fatal error:", err);
  await closeBrowser();
  process.exit(1);
});
