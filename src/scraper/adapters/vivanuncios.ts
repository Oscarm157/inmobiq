import * as cheerio from "cheerio";
import { createHttpClient, jitteredSleep, withRetry } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "vivanuncios" as const;

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

async function scrapePage(
  httpClient: ReturnType<typeof createHttpClient>,
  url: string,
  listingType: ListingType,
  propertyType: PropertyType
): Promise<RawListing[]> {
  const html = await withRetry(async () => {
    const res = await httpClient.get<string>(url, {
      responseType: "text",
      headers: { Referer: "https://www.vivanuncios.com.mx/" },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.data;
  });

  const $ = cheerio.load(html);
  const results: RawListing[] = [];

  // Vivanuncios card selectors (OLX-based platform)
  $("li[data-eid], [data-id], article.re-Listing").each((_i, el) => {
    try {
      const $el = $(el);

      const extId =
        $el.attr("data-eid") ||
        $el.attr("data-id") ||
        $el.find("a").first().attr("href")?.match(/iid-(\d+)/)?.[1] ||
        null;
      if (!extId) return;

      const href =
        $el.find("a[href*='/bienes-raices/']").first().attr("href") ||
        $el.find("a").first().attr("href") ||
        "";
      const externalUrl = href.startsWith("http")
        ? href
        : `https://www.vivanuncios.com.mx${href}`;

      const title =
        $el.find("h2, h3, [class*='title']").first().text().trim() || null;

      const rawPrice =
        $el.find("[class*='price'], [class*='Price']").first().text().trim();
      const price_mxn = parsePrice(rawPrice);

      const rawArea = $el.find("[class*='area'], [class*='m2']").first().text();
      const area_m2 = parseNumber(rawArea);

      const rawBeds = $el.find("[class*='room'], [class*='bed'], [class*='recamara']").first().text();
      const bedrooms = parseNumber(rawBeds);

      const rawBaths = $el.find("[class*='bath'], [class*='bano']").first().text();
      const bathrooms = parseNumber(rawBaths);

      const address =
        $el.find("[class*='location'], [class*='Location'], [class*='address']").first().text().trim() ||
        null;

      const images: string[] = [];
      $el.find("img").each((_j, img) => {
        const src = $(img).attr("src") || $(img).attr("data-src");
        if (src && !src.includes("placeholder") && src.includes("http")) images.push(src);
      });

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
        bedrooms,
        bathrooms,
        parking: null,
        lat: null,
        lng: null,
        address,
        images,
        raw_data: { raw_price: rawPrice },
      });
    } catch {
      // skip
    }
  });

  return results;
}

export const vivanunciosAdapter: ScraperAdapter = {
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
            ? "departamentos-y-pisos"
            : pt === "terreno"
            ? "terrenos"
            : "propiedades";
        const ltSlug = lt === "venta" ? "venta" : "renta";

        for (let page = 1; page <= pages; page++) {
          const url =
            page === 1
              ? `https://www.vivanuncios.com.mx/s-${ptSlug}/tijuana/${ltSlug}/v1c1076l10502p1`
              : `https://www.vivanuncios.com.mx/s-${ptSlug}/tijuana/${ltSlug}/v1c1076l10502p${page}`;

          console.log(`[vivanuncios] scraping ${url}`);

          try {
            const listings = await scrapePage(httpClient, url, lt, pt);
            allListings.push(...listings);
            console.log(`[vivanuncios] page ${page}/${pages}: ${listings.length} listings`);
          } catch (err) {
            console.error(`[vivanuncios] failed page ${page}: ${err}`);
          }

          if (page < pages) await jitteredSleep(1_500, 2_500);
        }
      }
    }

    return allListings;
  },
};
