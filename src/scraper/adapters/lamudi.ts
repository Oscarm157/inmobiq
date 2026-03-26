import { newPage } from "../browser";
import { jitteredSleep } from "../http";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "lamudi" as const;

const PROPERTY_TYPE_MAP: Record<PropertyType, string> = {
  casa: "casas",
  departamento: "departamentos",
  terreno: "terrenos",
  local: "locales-comerciales",
  oficina: "oficinas",
};

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
  url: string,
  listingType: ListingType,
  propertyType: PropertyType,
): Promise<RawListing[]> {
  const page = await newPage({ referer: "https://www.lamudi.com.mx/" });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // --- Try JSON-LD first (more structured) ---
    const jsonLdListings = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const results: Record<string, unknown>[] = [];
      for (const script of scripts) {
        try {
          const parsed = JSON.parse(script.textContent ?? "");
          results.push(parsed);
        } catch {
          // ignore malformed JSON-LD
        }
      }
      return results;
    });

    const results: RawListing[] = [];

    for (const ld of jsonLdListings) {
      if (ld["@type"] === "ItemList" && Array.isArray(ld.itemListElement)) {
        for (const item of ld.itemListElement as Record<string, unknown>[]) {
          const listing = (item.item ?? item) as Record<string, unknown>;
          const listingUrl = String(listing.url ?? "");
          const id = listingUrl.split("/").filter(Boolean).pop() ?? null;
          if (!id) continue;

          const offers = listing.offers as Record<string, unknown> | undefined;
          const geo = listing.geo as Record<string, unknown> | undefined;
          const address = listing.address as Record<string, unknown> | string | undefined;
          const addressStr =
            typeof address === "string"
              ? address.trim()
              : typeof address === "object" && address !== null
                ? String(
                    (address as Record<string, unknown>).streetAddress ??
                      (address as Record<string, unknown>).addressLocality ??
                      "",
                  ).trim()
                : null;

          results.push({
            source_portal: PORTAL,
            external_id: id,
            external_url: listingUrl,
            title: String(listing.name ?? "").trim() || null,
            description: String(listing.description ?? "").trim() || null,
            property_type: propertyType,
            listing_type: listingType,
            price_mxn: parsePrice(String(offers?.price ?? "")),
            price_usd: null,
            area_m2: listing.floorSize
              ? parseNumber(String((listing.floorSize as Record<string, unknown>)?.value ?? listing.floorSize))
              : null,
            area_construccion_m2: listing.floorSize
              ? parseNumber(String((listing.floorSize as Record<string, unknown>)?.value ?? listing.floorSize))
              : null,
            area_terreno_m2: (listing as Record<string, unknown>).lotSize
              ? parseNumber(String(((listing as Record<string, unknown>).lotSize as Record<string, unknown>)?.value ?? (listing as Record<string, unknown>).lotSize))
              : null,
            bedrooms: listing.numberOfRooms ? parseNumber(String(listing.numberOfRooms)) : null,
            bathrooms: listing.numberOfBathroomsTotal
              ? parseNumber(String(listing.numberOfBathroomsTotal))
              : null,
            parking: null,
            lat: geo?.latitude ? parseFloat(String(geo.latitude)) : null,
            lng: geo?.longitude ? parseFloat(String(geo.longitude)) : null,
            address: addressStr || null,
            images: [],
            raw_data: { source: "json-ld", raw: listing },
          });
        }

        // JSON-LD yielded results, return early
        if (results.length > 0) return results;
      }
    }

    // --- Fallback: DOM scraping ---
    const domListings = await page.evaluate(() => {
      const items: Record<string, unknown>[] = [];
      const cards = Array.from(
        document.querySelectorAll(
          ".listing-item, [class*='ListingCard'], article.js-listing-item",
        ),
      );

      for (const el of cards) {
        try {
          const linkEl = el.querySelector("a[href*='/inmueble/']") as HTMLAnchorElement | null;
          const href = linkEl?.getAttribute("href") ?? "";
          const extId = href.split("/").filter(Boolean).pop() ?? null;
          if (!extId) continue;

          const externalUrl = href.startsWith("http")
            ? href
            : `https://www.lamudi.com.mx${href}`;

          const titleEl = el.querySelector("h2, .listing-title, [class*='title']");
          const title = titleEl?.textContent?.trim() || null;

          const priceEl = el.querySelector("[class*='price']");
          const rawPrice = priceEl?.textContent?.trim() ?? "";

          const areaEl = el.querySelector("[class*='area'], [class*='m2']");
          const rawArea = areaEl?.textContent?.trim() ?? "";

          const bedsEl = el.querySelector("[class*='room'], [class*='bed']");
          const rawBeds = bedsEl?.textContent?.trim() ?? "";

          const bathsEl = el.querySelector("[class*='bath']");
          const rawBaths = bathsEl?.textContent?.trim() ?? "";

          const addressEl = el.querySelector("[class*='location'], [class*='address']");
          const address = addressEl?.textContent?.trim() || null;

          items.push({
            extId,
            externalUrl,
            title,
            rawPrice,
            rawArea,
            rawBeds,
            rawBaths,
            address,
          });
        } catch {
          // skip malformed card
        }
      }

      return items;
    });

    for (const item of domListings) {
      results.push({
        source_portal: PORTAL,
        external_id: String(item.extId),
        external_url: String(item.externalUrl),
        title: (item.title as string) || null,
        description: null,
        property_type: propertyType,
        listing_type: listingType,
        price_mxn: parsePrice(String(item.rawPrice ?? "")),
        price_usd: null,
        area_m2: parseNumber(item.rawArea as string),
        area_construccion_m2: propertyType !== "terreno" ? parseNumber(item.rawArea as string) : null,
        area_terreno_m2: propertyType === "terreno" ? parseNumber(item.rawArea as string) : null,
        bedrooms: parseNumber(item.rawBeds as string),
        bathrooms: parseNumber(item.rawBaths as string),
        parking: null,
        lat: null,
        lng: null,
        address: (item.address as string) || null,
        images: [],
        raw_data: { source: "html", raw_price: item.rawPrice },
      });
    }

    return results;
  } catch (err) {
    console.error(`[lamudi] error scraping ${url}:`, err);
    return [];
  } finally {
    await page.close();
  }
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

    const allListings: RawListing[] = [];

    for (const lt of listingTypes) {
      for (const pt of propertyTypes) {
        const ptSlug = PROPERTY_TYPE_MAP[pt] ?? "casas";
        const ltSlug = lt === "venta" ? "venta" : "renta";

        for (let pageNum = 1; pageNum <= pages; pageNum++) {
          const url =
            pageNum === 1
              ? `https://www.lamudi.com.mx/baja-california/tijuana/${ptSlug}/${ltSlug}/`
              : `https://www.lamudi.com.mx/baja-california/tijuana/${ptSlug}/${ltSlug}/?page=${pageNum}`;

          console.log(`[lamudi] scraping ${url}`);

          try {
            const listings = await scrapePage(url, lt, pt);
            allListings.push(...listings);
            console.log(`[lamudi] page ${pageNum}/${pages}: ${listings.length} listings`);
          } catch (err) {
            console.error(`[lamudi] failed page ${pageNum}: ${err}`);
          }

          if (pageNum < pages) await jitteredSleep(2_000, 3_000);
        }
      }
    }

    return allListings;
  },
};
