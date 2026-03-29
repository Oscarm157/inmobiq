import { newPage } from "../browser";
import { jitteredSleep } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "mercadolibre" as const;

const ML_BASE = "https://inmuebles.mercadolibre.com.mx";

const LISTING_TYPE_SLUG: Record<ListingType, string> = {
  venta: "venta",
  renta: "renta",
};

const PROPERTY_TYPE_SLUG: Record<PropertyType, string> = {
  casa: "casas",
  departamento: "departamentos",
  terreno: "terrenos",
  local: "locales",
  oficina: "oficinas",
};

const PER_PAGE = 48;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function parsePrice(raw: string | number | undefined | null): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  const digits = String(raw).replace(/[^\d.]/g, "");
  const val = parseFloat(digits);
  return isNaN(val) ? null : val;
}

function parseNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return isNaN(n) ? null : n;
}

/* ------------------------------------------------------------------ */
/*  Extract listings from __PRELOADED_STATE__                         */
/* ------------------------------------------------------------------ */

function extractFromPreloaded(
  state: Record<string, unknown>,
  listingType: ListingType,
  propertyType: PropertyType,
): RawListing[] {
  const results: RawListing[] = [];

  // The results live under state.initialState.results or state.results
  const items =
    ((state as Record<string, Record<string, unknown>>).initialState
      ?.results as unknown[]) ??
    (state.results as unknown[]) ??
    [];

  for (const item of items) {
    const it = item as Record<string, unknown>;
    const id = String(it.id ?? it.item_id ?? "");
    if (!id) continue;

    const permalink = String(it.permalink ?? "");
    const externalUrl = permalink || `${ML_BASE}/MLM-${id}`;

    // Price
    const priceObj = it.price as Record<string, unknown> | undefined;
    const price_mxn = priceObj
      ? parsePrice(priceObj.amount as string | number | null | undefined)
      : parsePrice(String(it.price ?? ""));

    // Location
    const location = it.location as Record<string, unknown> | undefined;
    const lat = location?.latitude
      ? parseFloat(String(location.latitude))
      : null;
    const lng = location?.longitude
      ? parseFloat(String(location.longitude))
      : null;
    const cityObj = location?.city as Record<string, unknown> | undefined;
    const address = location
      ? [location.address_line, cityObj?.name].filter(Boolean).join(", ")
      : null;

    // Attributes
    const attributes =
      (it.attributes as Record<string, unknown>[] | undefined) ?? [];
    let area_construccion_m2: number | null = null;
    let area_terreno_m2: number | null = null;
    let bedrooms: number | null = null;
    let bathrooms: number | null = null;
    let parking: number | null = null;

    // Rental-specific attributes
    let is_furnished: boolean | null = null;
    let maintenance_fee: number | null = null;
    let pets_allowed: boolean | null = null;

    for (const attr of attributes) {
      const attrId = String(attr.id ?? "").toLowerCase();
      const val = String(attr.value_name ?? attr.value ?? "");
      if (attrId.includes("construccion") || attrId.includes("covered"))
        area_construccion_m2 = parseNumber(val);
      else if (attrId.includes("terreno") || attrId.includes("total_area"))
        area_terreno_m2 = parseNumber(val);
      else if ((attrId.includes("m2") || attrId.includes("surface")) && !area_construccion_m2)
        area_construccion_m2 = parseNumber(val);
      else if (attrId.includes("bedroom") || attrId.includes("room"))
        bedrooms = parseNumber(val);
      else if (attrId.includes("bathroom") || attrId.includes("bath"))
        bathrooms = parseNumber(val);
      else if (attrId.includes("parking") || attrId.includes("garage"))
        parking = parseNumber(val);
      else if (attrId.includes("furnished") || attrId.includes("amueblado")) {
        const lv = val.toLowerCase();
        is_furnished = lv !== "no" && lv !== "sin" && lv !== "" && lv !== "0";
      }
      else if (attrId.includes("maintenance") || attrId.includes("mantenimiento") || attrId.includes("expensas")) {
        const n = parseNumber(val);
        if (n && n > 0 && n < 50_000) maintenance_fee = n;
      }
      else if (attrId.includes("pets") || attrId.includes("mascota")) {
        const lv = val.toLowerCase();
        pets_allowed = lv !== "no" && lv !== "0" && lv !== "";
      }
    }

    // Images — pictures array or thumbnail fallback
    const pictures: string[] = [];
    const picsArray = it.pictures as Record<string, unknown>[] | undefined;
    if (Array.isArray(picsArray) && picsArray.length > 0) {
      for (const pic of picsArray) {
        const url = String(pic.url ?? pic.secure_url ?? "");
        if (url) pictures.push(url);
      }
    } else if (it.thumbnail_id) {
      pictures.push(
        `https://http2.mlstatic.com/D_NQ_NP_${it.thumbnail_id}-V.jpg`,
      );
    } else if (it.thumbnail) {
      pictures.push(String(it.thumbnail));
    }

    results.push({
      source_portal: PORTAL,
      external_id: id,
      external_url: externalUrl,
      title: String(it.title ?? "").trim() || null,
      description: null,
      property_type: propertyType,
      listing_type: listingType,
      price_mxn,
      price_usd: null,
      area_m2: area_construccion_m2 ?? area_terreno_m2,
      area_construccion_m2: area_construccion_m2 ?? (propertyType !== "terreno" ? area_terreno_m2 : null),
      area_terreno_m2: area_terreno_m2 ?? (propertyType === "terreno" ? area_construccion_m2 : null),
      bedrooms,
      bathrooms,
      parking,
      lat,
      lng,
      address: String(address ?? "").trim() || null,
      images: pictures,
      raw_data: { source: "preloaded_state", raw: it },
      // Rental attributes (only for renta listings)
      ...(listingType === "renta" ? {
        is_furnished,
        maintenance_fee,
        pets_allowed,
      } : {}),
    });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Scrape a single search-results page using Playwright              */
/* ------------------------------------------------------------------ */

async function scrapePage(
  url: string,
  listingType: ListingType,
  propertyType: PropertyType,
): Promise<RawListing[]> {
  const page = await newPage({ referer: "https://www.google.com.mx/" });

  try {
    // Strategy 1: intercept the __PRELOADED_STATE__ or API JSON via
    // response listener. We collect any matching payload before navigating.
    let interceptedState: Record<string, unknown> | null = null;

    page.on("response", async (response) => {
      try {
        const resUrl = response.url();
        const ct = response.headers()["content-type"] ?? "";

        // ML sometimes loads results through an API endpoint
        if (
          ct.includes("application/json") &&
          (resUrl.includes("/api/") || resUrl.includes("/search"))
        ) {
          const json = (await response.json()) as Record<string, unknown>;
          if (json && (json.results || json.initialState)) {
            interceptedState = json;
          }
        }
      } catch {
        // ignore non-JSON responses
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Give the page a moment to finish XHR requests
    await page.waitForTimeout(2_000);

    // Strategy 2 (primary): read window.__PRELOADED_STATE__ directly
    const stateFromWindow = await page.evaluate(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).__PRELOADED_STATE__ ?? null;
      } catch {
        return null;
      }
    });

    const state =
      (stateFromWindow as Record<string, unknown> | null) ?? interceptedState;

    if (state) {
      const listings = extractFromPreloaded(state, listingType, propertyType);
      if (listings.length > 0) return listings;
    }

    // Strategy 3 (fallback): extract __PRELOADED_STATE__ from raw HTML via regex
    const html = await page.content();
    const match = html.match(
      /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    );
    if (match) {
      try {
        const parsed = JSON.parse(match[1]) as Record<string, unknown>;
        const listings = extractFromPreloaded(parsed, listingType, propertyType);
        if (listings.length > 0) return listings;
      } catch {
        // JSON parse failed — fall through
      }
    }

    console.warn(`[mercadolibre] no listings extracted from ${url}`);
    return [];
  } catch (err) {
    console.error(`[mercadolibre] error scraping ${url}: ${err}`);
    return [];
  } finally {
    // Close context (which also closes the page)
    const ctx = page.context();
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ */
/*  Build page URL                                                    */
/* ------------------------------------------------------------------ */

function buildUrl(
  listingType: ListingType,
  propertyType: PropertyType,
  pageNum: number,
): string {
  const ltSlug = LISTING_TYPE_SLUG[listingType];
  const ptSlug = PROPERTY_TYPE_SLUG[propertyType];

  if (pageNum === 1) {
    return `${ML_BASE}/${ltSlug}/${ptSlug}/tijuana/`;
  }

  const offset = (pageNum - 1) * PER_PAGE + 1;
  return `${ML_BASE}/${ltSlug}/${ptSlug}/tijuana/_Desde_${offset}_NoIndex_True`;
}

/* ------------------------------------------------------------------ */
/*  Adapter                                                           */
/* ------------------------------------------------------------------ */

export const mercadolibreAdapter: ScraperAdapter = {
  portal: PORTAL,

  async scrape(config: ScraperConfig): Promise<RawListing[]> {
    const pages = config.pages ?? 5;
    const listingTypes: ListingType[] = config.listing_type
      ? [config.listing_type]
      : ["venta", "renta"];
    const propertyTypes: PropertyType[] = config.property_type
      ? [config.property_type]
      : ["casa", "departamento"];

    const allListings: RawListing[] = [];

    for (const lt of listingTypes) {
      for (const pt of propertyTypes) {
        for (let page = 1; page <= pages; page++) {
          const url = buildUrl(lt, pt, page);
          console.log(`[mercadolibre] scraping ${url}`);

          try {
            const listings = await scrapePage(url, lt, pt);
            allListings.push(...listings);
            console.log(
              `[mercadolibre] page ${page}/${pages}: ${listings.length} listings`,
            );
          } catch (err) {
            console.error(`[mercadolibre] failed page ${page}: ${err}`);
          }

          // ML has strong anti-bot; use longer jittered delays
          if (page < pages) await jitteredSleep(3_500, 5_500);
        }
      }
    }

    return allListings;
  },
};
