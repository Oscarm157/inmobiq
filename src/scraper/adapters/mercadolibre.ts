import * as cheerio from "cheerio";
import { createHttpClient, jitteredSleep, withRetry, randomUserAgent } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "mercadolibre" as const;

// MercadoLibre has strong anti-bot; uses a combination of HTML + JSON in __PRELOADED_STATE__
const ML_BASE = "https://inmuebles.mercadolibre.com.mx";

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

/** Try to extract __PRELOADED_STATE__ JSON from ML HTML */
function extractPreloadedState(html: string): Record<string, unknown> | null {
  const match = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Extract listings from ML's JSON API response */
function extractFromPreloaded(
  state: Record<string, unknown>,
  listingType: ListingType,
  propertyType: PropertyType
): RawListing[] {
  const results: RawListing[] = [];

  // Structure: state.initialState.results or state.results
  const results_ =
    ((state as Record<string, Record<string, unknown>>).initialState?.results as unknown[]) ??
    (state.results as unknown[]) ??
    [];

  for (const item of results_) {
    const it = item as Record<string, unknown>;
    const id = String(it.id ?? it.item_id ?? "");
    if (!id) continue;

    const permalink = String(it.permalink ?? "");
    const externalUrl = permalink || `${ML_BASE}/MLM-${id}`;

    const priceObj = it.price as Record<string, unknown> | undefined;
    const price_mxn = priceObj
      ? parsePrice(priceObj.amount)
      : parsePrice(String(it.price ?? ""));

    const location = it.location as Record<string, unknown> | undefined;
    const lat = location?.latitude ? parseFloat(String(location.latitude)) : null;
    const lng = location?.longitude ? parseFloat(String(location.longitude)) : null;
    const address = location
      ? [location.address_line, location.city?.name]
          .filter(Boolean)
          .join(", ")
      : null;

    const attributes = (it.attributes as Record<string, unknown>[] | undefined) ?? [];
    let area_m2: number | null = null;
    let bedrooms: number | null = null;
    let bathrooms: number | null = null;
    let parking: number | null = null;

    for (const attr of attributes) {
      const id_ = String(attr.id ?? "").toLowerCase();
      const val = String(attr.value_name ?? attr.value ?? "");
      if (id_.includes("m2") || id_.includes("surface")) area_m2 = parseNumber(val);
      else if (id_.includes("bedroom") || id_.includes("room")) bedrooms = parseNumber(val);
      else if (id_.includes("bathroom") || id_.includes("bath")) bathrooms = parseNumber(val);
      else if (id_.includes("parking") || id_.includes("garage")) parking = parseNumber(val);
    }

    const pictures = (it.thumbnail_id
      ? [`https://http2.mlstatic.com/D_NQ_NP_${it.thumbnail_id}-V.jpg`]
      : []) as string[];

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
      area_m2,
      bedrooms,
      bathrooms,
      parking,
      lat,
      lng,
      address: String(address ?? "").trim() || null,
      images: pictures,
      raw_data: { source: "preloaded_state", raw: it },
    });
  }

  return results;
}

async function scrapePage(
  httpClient: ReturnType<typeof createHttpClient>,
  url: string,
  listingType: ListingType,
  propertyType: PropertyType
): Promise<RawListing[]> {
  const html = await withRetry(async () => {
    const res = await httpClient.get<string>(url, {
      responseType: "text",
      headers: {
        "User-Agent": randomUserAgent(),
        Referer: "https://www.google.com.mx/",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.data;
  });

  // Try preloaded state first
  const state = extractPreloadedState(html);
  if (state) {
    const fromState = extractFromPreloaded(state, listingType, propertyType);
    if (fromState.length > 0) return fromState;
  }

  // Fallback: HTML scraping
  const $ = cheerio.load(html);
  const results: RawListing[] = [];

  $(".ui-search-result, .results-item, [class*='search-result']").each((_i, el) => {
    try {
      const $el = $(el);
      const href =
        $el.find("a.ui-search-link, a[href*='inmuebles.mercadolibre']").first().attr("href") ?? "";
      const extId = href.match(/MLM-(\d+)/)?.[1] ?? null;
      if (!extId) return;

      const externalUrl = href;
      const title = $el.find("h2.ui-search-item__title, h2, h3").first().text().trim() || null;
      const rawPrice = $el.find(".price-tag-fraction, [class*='price']").first().text().trim();
      const price_mxn = parsePrice(rawPrice);
      const address =
        $el.find(".ui-search-item__location, [class*='location']").first().text().trim() || null;

      results.push({
        source_portal: PORTAL,
        external_id: String(extId),
        external_url: externalUrl,
        title,
        description: null,
        property_type: propertyType,
        listing_type: listingType,
        price_mxn,
        price_usd: null,
        area_m2: null,
        bedrooms: null,
        bathrooms: null,
        parking: null,
        lat: null,
        lng: null,
        address,
        images: [],
        raw_data: { source: "html", raw_price: rawPrice },
      });
    } catch {
      // skip
    }
  });

  return results;
}

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

    const httpClient = createHttpClient();
    const allListings: RawListing[] = [];

    for (const lt of listingTypes) {
      for (const pt of propertyTypes) {
        const ptSlug =
          pt === "casa"
            ? "casas"
            : pt === "departamento"
            ? "departamentos"
            : pt === "terreno"
            ? "terrenos"
            : "propiedades";
        // ML uses offset pagination: _Desde_1, _Desde_49, _Desde_97...
        const perPage = 48;

        for (let page = 1; page <= pages; page++) {
          const offset = (page - 1) * perPage + 1;
          const suffix = page === 1 ? "" : `_Desde_${offset}_NoIndex_True`;
          const url = `${ML_BASE}/${lt === "venta" ? "venta" : "renta"}/${ptSlug}/tijuana${suffix}`;

          console.log(`[mercadolibre] scraping ${url}`);

          try {
            const listings = await scrapePage(httpClient, url, lt, pt);
            allListings.push(...listings);
            console.log(`[mercadolibre] page ${page}/${pages}: ${listings.length} listings`);
          } catch (err) {
            console.error(`[mercadolibre] failed page ${page}: ${err}`);
          }

          // ML has strong anti-bot; use longer delays
          if (page < pages) await jitteredSleep(3_500, 5_500);
        }
      }
    }

    return allListings;
  },
};
