import { newPage } from "../browser";
import { jitteredSleep } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "vivanuncios" as const;

const PROPERTY_TYPE_SLUGS: Record<PropertyType, string> = {
  casa: "casas",
  departamento: "departamentos",
  terreno: "terrenos",
  local: "locales-comerciales",
  oficina: "oficinas",
};

const LISTING_TYPE_SLUGS: Record<ListingType, string> = {
  venta: "venta",
  renta: "renta",
};

function buildUrl(propertyType: PropertyType, listingType: ListingType, page: number): string {
  const ptSlug = PROPERTY_TYPE_SLUGS[propertyType] ?? "casas";
  const ltSlug = LISTING_TYPE_SLUGS[listingType] ?? "venta";
  return `https://www.vivanuncios.com.mx/s-${ptSlug}/tijuana/${ltSlug}/v1c1076l10502p${page}`;
}

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

interface ExtractedCard {
  extId: string | null;
  href: string;
  title: string | null;
  rawPrice: string;
  rawArea: string;
  rawBeds: string;
  rawBaths: string;
  address: string | null;
  images: string[];
}

async function scrapePage(
  url: string,
  listingType: ListingType,
  propertyType: PropertyType,
): Promise<RawListing[]> {
  const page = await newPage({ referer: "https://www.vivanuncios.com.mx/" });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for listing cards to appear; use a broad selector
    await page.waitForSelector(
      "li[data-eid], [data-id], article.re-Listing, .ads-list-item",
      { timeout: 15_000 },
    ).catch(() => {
      // If no cards found, page may be empty — we'll just return []
    });

    const cards: ExtractedCard[] = await page.evaluate(() => {
      const results: ExtractedCard[] = [];

      const items = document.querySelectorAll(
        "li[data-eid], [data-id], article.re-Listing, .ads-list-item",
      );

      items.forEach((el) => {
        const extId =
          el.getAttribute("data-eid") ||
          el.getAttribute("data-id") ||
          el.querySelector("a")?.href?.match(/iid-(\d+)/)?.[1] ||
          null;

        const anchor =
          el.querySelector<HTMLAnchorElement>("a[href*='/bienes-raices/']") ||
          el.querySelector<HTMLAnchorElement>("a");
        const href = anchor?.href ?? "";

        const titleEl = el.querySelector("h2, h3, [class*='title']");
        const title = titleEl?.textContent?.trim() || null;

        const priceEl = el.querySelector("[class*='price'], [class*='Price']");
        const rawPrice = priceEl?.textContent?.trim() ?? "";

        const areaEl = el.querySelector("[class*='area'], [class*='m2']");
        const rawArea = areaEl?.textContent?.trim() ?? "";

        const bedsEl = el.querySelector(
          "[class*='room'], [class*='bed'], [class*='recamara']",
        );
        const rawBeds = bedsEl?.textContent?.trim() ?? "";

        const bathsEl = el.querySelector("[class*='bath'], [class*='bano']");
        const rawBaths = bathsEl?.textContent?.trim() ?? "";

        const addrEl = el.querySelector(
          "[class*='location'], [class*='Location'], [class*='address']",
        );
        const address = addrEl?.textContent?.trim() || null;

        const images: string[] = [];
        el.querySelectorAll("img").forEach((img) => {
          const src = img.src || img.getAttribute("data-src") || "";
          if (src && !src.includes("placeholder") && src.startsWith("http")) {
            images.push(src);
          }
        });

        results.push({ extId, href, title, rawPrice, rawArea, rawBeds, rawBaths, address, images });
      });

      return results;
    });

    const listings: RawListing[] = [];

    for (const card of cards) {
      if (!card.extId) continue;

      const externalUrl = card.href.startsWith("http")
        ? card.href
        : `https://www.vivanuncios.com.mx${card.href}`;

      listings.push({
        source_portal: PORTAL,
        external_id: String(card.extId),
        external_url: externalUrl,
        title: card.title,
        description: null,
        property_type: propertyType,
        listing_type: listingType,
        price_mxn: parsePrice(card.rawPrice),
        price_usd: null,
        area_m2: parseNumber(card.rawArea),
        area_construccion_m2: propertyType !== "terreno" ? parseNumber(card.rawArea) : null,
        area_terreno_m2: propertyType === "terreno" ? parseNumber(card.rawArea) : null,
        bedrooms: parseNumber(card.rawBeds),
        bathrooms: parseNumber(card.rawBaths),
        parking: null,
        lat: null,
        lng: null,
        address: card.address,
        images: card.images,
        raw_data: { raw_price: card.rawPrice },
      });
    }

    return listings;
  } finally {
    await page.context().close();
  }
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

    const allListings: RawListing[] = [];

    for (const lt of listingTypes) {
      for (const pt of propertyTypes) {
        for (let pg = 1; pg <= pages; pg++) {
          const url = buildUrl(pt, lt, pg);
          console.log(`[vivanuncios] scraping ${url}`);

          try {
            const listings = await scrapePage(url, lt, pt);
            allListings.push(...listings);
            console.log(
              `[vivanuncios] page ${pg}/${pages}: ${listings.length} listings`,
            );
          } catch (err) {
            console.error(`[vivanuncios] failed page ${pg}: ${err}`);
          }

          if (pg < pages) await jitteredSleep(1_500, 2_500);
        }
      }
    }

    return allListings;
  },
};
