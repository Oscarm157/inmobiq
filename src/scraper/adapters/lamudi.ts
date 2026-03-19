import * as cheerio from "cheerio";
import { createHttpClient, jitteredSleep, withRetry } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "lamudi" as const;

function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  const val = parseFloat(digits);
  return isNaN(val) ? null : val;
}

function parseNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  return isNaN(n) ? null : n;
}

/** Extract JSON-LD from page HTML */
function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      results.push(parsed);
    } catch {
      // ignore malformed JSON-LD
    }
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
      headers: { Referer: "https://www.lamudi.com.mx/" },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.data;
  });

  const $ = cheerio.load(html);
  const jsonLds = extractJsonLd(html);
  const results: RawListing[] = [];

  // Try JSON-LD first (ItemList or RealEstateListing)
  for (const ld of jsonLds) {
    if (ld["@type"] === "ItemList" && Array.isArray(ld.itemListElement)) {
      for (const item of ld.itemListElement as Record<string, unknown>[]) {
        const listing = (item.item ?? item) as Record<string, unknown>;
        const url_ = String(listing.url ?? "");
        const id_ = url_.split("/").filter(Boolean).pop() ?? null;
        if (!id_) continue;

        const price = listing.offers as Record<string, unknown> | undefined;
        const geo = listing.geo as Record<string, unknown> | undefined;

        results.push({
          source_portal: PORTAL,
          external_id: id_,
          external_url: url_,
          title: String(listing.name ?? "").trim() || null,
          description: String(listing.description ?? "").trim() || null,
          property_type: propertyType,
          listing_type: listingType,
          price_mxn: parsePrice(String(price?.price ?? "")),
          price_usd: null,
          area_m2: null,
          bedrooms: null,
          bathrooms: null,
          parking: null,
          lat: geo?.latitude ? parseFloat(String(geo.latitude)) : null,
          lng: geo?.longitude ? parseFloat(String(geo.longitude)) : null,
          address: String(listing.address ?? "").trim() || null,
          images: [],
          raw_data: { source: "json-ld", raw: listing },
        });
      }
      return results;
    }
  }

  // Fallback: HTML parsing for Lamudi listing cards
  $(".listing-item, [class*='ListingCard'], article.js-listing-item").each((_i, el) => {
    try {
      const $el = $(el);
      const linkEl = $el.find("a[href*='/inmueble/']").first();
      const href = linkEl.attr("href") ?? "";
      const extId = href.split("/").filter(Boolean).pop() ?? null;
      if (!extId) return;

      const externalUrl = href.startsWith("http") ? href : `https://www.lamudi.com.mx${href}`;

      const title =
        $el.find("h2, .listing-title, [class*='title']").first().text().trim() || null;
      const rawPrice = $el.find("[class*='price']").first().text().trim();
      const price_mxn = parsePrice(rawPrice);
      const rawArea = $el.find("[class*='area'], [class*='m2']").first().text();
      const area_m2 = parseNumber(rawArea);
      const address =
        $el.find("[class*='location'], [class*='address']").first().text().trim() || null;

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
        area_m2,
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

export const lamudiAdapter: ScraperAdapter = {
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
        const ptSlug = pt === "casa" ? "casas" : pt === "departamento" ? "departamentos" : pt;
        const ltSlug = lt === "venta" ? "venta" : "renta";

        for (let page = 1; page <= pages; page++) {
          const offset = (page - 1) * 20;
          const url =
            page === 1
              ? `https://www.lamudi.com.mx/baja-california/tijuana/${ptSlug}/${ltSlug}/`
              : `https://www.lamudi.com.mx/baja-california/tijuana/${ptSlug}/${ltSlug}/?page=${page}`;

          console.log(`[lamudi] scraping ${url}`);

          try {
            const listings = await scrapePage(httpClient, url, lt, pt);
            allListings.push(...listings);
            console.log(`[lamudi] page ${page}/${pages}: ${listings.length} listings`);
          } catch (err) {
            console.error(`[lamudi] failed page ${page}: ${err}`);
          }

          if (page < pages) await jitteredSleep(2_000, 3_000);
        }
      }
    }

    // Rotate user agent after each portal
    return allListings;
  },
};
