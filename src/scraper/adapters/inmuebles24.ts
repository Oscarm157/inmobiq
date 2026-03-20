import { runApifyActor } from "../apify-client";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "inmuebles24" as const;
const ACTOR_ID = "ecomscrape/inmuebles24-property-listings-scraper";

// ─── Apify response types ───────────────────────────────────────────────────

interface ApifyI24Listing {
  posting_id: string;
  url: string;
  title: string;
  description_normalized?: string;
  real_estate_type?: { name: string };
  price_operation_types?: Array<{
    operation_type: { name: string };
    prices: Array<{ amount: number; currency: string }>;
  }>;
  main_features?: Record<
    string,
    { label: string; value: string; measure?: string | null }
  >;
  posting_location?: {
    address?: { name: string };
    location?: { name: string };
    posting_geolocation?: {
      geolocation?: { latitude: number; longitude: number };
    };
  };
  visible_pictures?: {
    pictures: Array<{ url730x532?: string; url360x266?: string }>;
  };
  [key: string]: unknown;
}

// ─── URL builders ───────────────────────────────────────────────────────────

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

function buildSearchUrls(config: ScraperConfig): string[] {
  const listingTypes: ListingType[] = config.listing_type
    ? [config.listing_type]
    : ["venta"];
  const pages = config.pages ?? 5;

  // Build paginated URLs — one per page so the actor doesn't need to handle pagination
  // Inmuebles24 uses: base-url.html (page 1), base-url-pagina-2.html, etc.
  const urls: string[] = [];

  for (const lt of listingTypes) {
    const ltSlug = LISTING_TYPE_SLUG[lt] ?? "venta";

    let baseUrl: string;
    if (config.property_type) {
      const ptSlug = PROPERTY_TYPE_SLUG[config.property_type] ?? "casas";
      baseUrl = `https://www.inmuebles24.com/${ptSlug}-en-${ltSlug}-en-tijuana`;
    } else {
      baseUrl = `https://www.inmuebles24.com/inmuebles-en-${ltSlug}-en-tijuana`;
    }

    // Page 1 = base.html, Page N = base-pagina-N.html
    urls.push(`${baseUrl}.html`);
    for (let p = 2; p <= pages; p++) {
      urls.push(`${baseUrl}-pagina-${p}.html`);
    }
  }

  return urls;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapPropertyType(name: string | undefined): PropertyType {
  if (!name) return "casa";
  const lower = name.toLowerCase();
  if (lower.includes("departamento")) return "departamento";
  if (lower.includes("terreno")) return "terreno";
  if (lower.includes("local") || lower.includes("comercial")) return "local";
  if (lower.includes("oficina")) return "oficina";
  return "casa";
}

function mapListingType(name: string | undefined): ListingType {
  if (!name) return "venta";
  return name.toLowerCase().includes("renta") ? "renta" : "venta";
}

function getFeatureValue(
  features: Record<string, { label: string; value: string }> | undefined,
  ...keywords: string[]
): number | null {
  if (!features) return null;
  for (const [, feat] of Object.entries(features)) {
    const label = feat.label.toLowerCase();
    if (keywords.some((kw) => label.includes(kw))) {
      const n = parseFloat(feat.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
}

function mapToRawListing(item: ApifyI24Listing): RawListing {
  const op = item.price_operation_types?.[0];
  const price = op?.prices?.[0];
  const isMxn = price?.currency === "MXN" || price?.currency === "MN";
  const priceMxn = isMxn ? price.amount : null;
  const priceUsd = price?.currency === "USD" ? price.amount : null;

  const geo = item.posting_location?.posting_geolocation?.geolocation;
  const address = [
    item.posting_location?.address?.name,
    item.posting_location?.location?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const images =
    item.visible_pictures?.pictures
      ?.map((p) => p.url730x532 || p.url360x266)
      .filter((url): url is string => !!url) ?? [];

  const area =
    getFeatureValue(
      item.main_features,
      "superficie construí",
      "construida",
      "terreno",
    ) ?? getFeatureValue(item.main_features, "superficie");

  return {
    source_portal: PORTAL,
    external_id: String(item.posting_id),
    external_url: item.url.startsWith("http")
      ? item.url
      : `https://www.inmuebles24.com${item.url}`,
    title: item.title ?? null,
    description: item.description_normalized ?? null,
    property_type: mapPropertyType(item.real_estate_type?.name),
    listing_type: mapListingType(op?.operation_type?.name),
    price_mxn: priceMxn,
    price_usd: priceUsd,
    area_m2: area,
    bedrooms: getFeatureValue(item.main_features, "recámara", "recamara"),
    bathrooms: getFeatureValue(item.main_features, "baño", "bano"),
    parking: getFeatureValue(item.main_features, "estacionamiento"),
    lat: geo?.latitude ?? null,
    lng: geo?.longitude ?? null,
    address: address || null,
    images,
    raw_data: item as unknown as Record<string, unknown>,
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export const inmuebles24Adapter: ScraperAdapter = {
  portal: PORTAL,

  async scrape(config: ScraperConfig): Promise<RawListing[]> {
    const urls = buildSearchUrls(config);

    console.log(
      `[inmuebles24] Calling Apify actor with ${urls.length} page URLs`,
    );

    const items = await runApifyActor<ApifyI24Listing>(ACTOR_ID, {
      urls,
      max_items_per_url: 50,  // Each URL is one page (~30 items), 50 as safety margin
      max_retries_per_url: 5,
      ignore_url_failures: true,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        apifyProxyCountry: "MX",
      },
    });

    const listings = items.map(mapToRawListing);
    console.log(`[inmuebles24] Mapped ${listings.length} listings from Apify`);

    return listings;
  },
};
