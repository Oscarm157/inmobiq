import * as cheerio from "cheerio";
import { createHttpClient, jitteredSleep, withRetry } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "inmuebles24" as const;

// Maps Inmuebles24 URL path segments → our enums
const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  casas: "casa",
  departamentos: "departamento",
  terrenos: "terreno",
  locales: "local",
  oficinas: "oficina",
};

const LISTING_TYPE_MAP: Record<string, ListingType> = {
  venta: "venta",
  renta: "renta",
};

function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d.]/g, "");
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
    const res = await httpClient.get<string>(url, { responseType: "text" });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.data;
  });

  const $ = cheerio.load(html);
  const results: RawListing[] = [];

  // Inmuebles24 listing cards
  $("[data-listing-type], .posting-card, article.posting").each((_i, el) => {
    try {
      const $el = $(el);

      // External ID — from data-id or from the URL
      const extId =
        $el.attr("data-id") ||
        $el.attr("data-postingid") ||
        $el.find("a[href*='/propiedades/']").attr("href")?.match(/\/(\d+)\.html/)?.[1] ||
        null;
      if (!extId) return;

      const relUrl =
        $el.find("a[href*='/propiedades/']").first().attr("href") ||
        $el.find("a.posting-title-link").first().attr("href") ||
        "";
      const externalUrl = relUrl.startsWith("http")
        ? relUrl
        : `https://www.inmuebles24.com${relUrl}`;

      const title =
        $el.find(".posting-title h2, .posting-title, [class*='title']").first().text().trim() ||
        null;

      const rawPrice =
        $el.find(".price-value, [class*='price'], .firstPrice").first().text().trim();
      const price_mxn = parsePrice(rawPrice);

      const rawArea = $el.find("[class*='area'], [class*='m2']").first().text();
      const area_m2 = parseNumber(rawArea);

      const rawBeds = $el.find("[class*='room'], [class*='bed']").first().text();
      const bedrooms = parseNumber(rawBeds);

      const rawBaths = $el.find("[class*='bath']").first().text();
      const bathrooms = parseNumber(rawBaths);

      const address =
        $el.find(".posting-location, [class*='location'], [class*='address']").first().text().trim() ||
        null;

      const images: string[] = [];
      $el.find("img[src*='inmuebles24'], img[data-src]").each((_j, img) => {
        const src = $(img).attr("src") || $(img).attr("data-src");
        if (src && !src.includes("placeholder")) images.push(src);
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
        raw_data: { raw_price: rawPrice, raw_area: rawArea, raw_beds: rawBeds },
      });
    } catch {
      // Skip malformed listings silently
    }
  });

  return results;
}

export const inmuebles24Adapter: ScraperAdapter = {
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
        const ptSlug = Object.entries(PROPERTY_TYPE_MAP).find(([, v]) => v === pt)?.[0] ?? "casas";
        const ltSlug = Object.entries(LISTING_TYPE_MAP).find(([, v]) => v === lt)?.[0] ?? "venta";

        for (let page = 1; page <= pages; page++) {
          const url = `https://www.inmuebles24.com/${ptSlug}-en-${ltSlug}-en-tijuana-pagina-${page}.html`;
          console.log(`[inmuebles24] scraping ${url}`);

          try {
            const listings = await scrapePage(httpClient, url, lt, pt);
            allListings.push(...listings);
            console.log(`[inmuebles24] page ${page}/${pages}: ${listings.length} listings`);
          } catch (err) {
            console.error(`[inmuebles24] failed page ${page}: ${err}`);
          }

          if (page < pages) await jitteredSleep(2_000, 3_000);
        }
      }
    }

    return allListings;
  },
};
