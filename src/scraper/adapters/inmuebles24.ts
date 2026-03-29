import { runApifyActorBatched } from "../apify-client";
import type { RawListing, ScraperAdapter, ScraperConfig } from "../types";
import type { PropertyType, ListingType } from "@/types/database";

const PORTAL = "inmuebles24" as const;
const ACTOR_ID = "ecomscrape/inmuebles24-property-listings-scraper";

// ─── Apify response types ───────────────────────────────────────────────────

export interface ApifyI24Listing {
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

/** Check if a feature label matches any keyword (case-insensitive) */
function hasFeatureLabel(
  features: Record<string, { label: string; value: string }> | undefined,
  ...keywords: string[]
): { found: boolean; value: string | null } {
  if (!features) return { found: false, value: null };
  for (const [, feat] of Object.entries(features)) {
    const label = feat.label.toLowerCase();
    if (keywords.some((kw) => label.includes(kw))) {
      return { found: true, value: feat.value };
    }
  }
  return { found: false, value: null };
}

/** Extract rental-specific attributes from Inmuebles24 main_features and description */
function extractI24RentalAttrs(item: ApifyI24Listing): {
  is_furnished: boolean | null;
  maintenance_fee: number | null;
  deposit_months: number | null;
  pets_allowed: boolean | null;
  is_short_term: boolean | null;
  utilities_included: boolean | null;
  amenities: string[];
} {
  const features = item.main_features;
  const desc = (item.description_normalized ?? "").toLowerCase();
  const title = (item.title ?? "").toLowerCase();

  // Furnished
  let is_furnished: boolean | null = null;
  const furnishedFeat = hasFeatureLabel(features, "amueblado", "furnished", "equipado");
  if (furnishedFeat.found) {
    const val = (furnishedFeat.value ?? "").toLowerCase();
    is_furnished = val !== "no" && val !== "sin" && val !== "0";
  } else if (/amueblado|furnished|equipado/i.test(desc) || /amueblado|furnished/i.test(title)) {
    is_furnished = !/sin\s+amueblar|no\s+amueblado|sin\s+muebles/i.test(desc);
  }

  // Maintenance fee
  let maintenance_fee: number | null = null;
  const maintFeat = hasFeatureLabel(features, "mantenimiento", "maintenance", "cuota");
  if (maintFeat.found && maintFeat.value) {
    const n = parseFloat(maintFeat.value.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) maintenance_fee = n;
  }
  if (!maintenance_fee) {
    const maintMatch = desc.match(/mantenimiento\s*(?:de\s*)?\$?\s*([\d,]+(?:\.\d+)?)/);
    if (maintMatch) {
      const n = parseFloat(maintMatch[1].replace(/,/g, ""));
      if (!isNaN(n) && n > 0 && n < 50_000) maintenance_fee = n;
    }
  }

  // Deposit
  let deposit_months: number | null = null;
  const depositMatch = desc.match(/dep[oó]sito?\s*(?:de\s*)?(\d+)\s*mes/i);
  if (depositMatch) deposit_months = parseInt(depositMatch[1], 10);

  // Pets
  let pets_allowed: boolean | null = null;
  const petsFeat = hasFeatureLabel(features, "mascota", "pets", "pet");
  if (petsFeat.found) {
    const val = (petsFeat.value ?? "").toLowerCase();
    pets_allowed = val !== "no" && val !== "0";
  } else if (/mascotas?\s*permitidas?|pet\s*friendly|se\s*aceptan\s*mascotas/i.test(desc) || /pet\s*friendly/i.test(title)) {
    pets_allowed = true;
  } else if (/no\s*mascotas|mascotas?\s*no\s*permitidas?|sin\s*mascotas/i.test(desc)) {
    pets_allowed = false;
  }

  // Short-term
  let is_short_term: boolean | null = null;
  if (/temporal|corto\s*plazo|short\s*term|airbnb|por\s*noche|amueblado\s*temporal/i.test(desc) ||
      /temporal|short\s*term|airbnb/i.test(title)) {
    is_short_term = true;
  }

  // Utilities included
  let utilities_included: boolean | null = null;
  if (/servicios?\s*incluidos?|utilit(?:ies|y)\s*included/i.test(desc)) {
    utilities_included = true;
  }

  // Amenities from features
  const amenities: string[] = [];
  const AMENITY_KEYWORDS: [string[], string][] = [
    [["alberca", "piscina", "pool"], "Alberca"],
    [["gimnas", "gym", "fitness"], "Gimnasio"],
    [["elevador", "ascensor"], "Elevador"],
    [["seguridad", "vigilancia", "guardia", "cctv"], "Seguridad 24/7"],
    [["roof garden", "rooftop"], "Roof Garden"],
    [["área común", "areas comunes", "salon de evento"], "Áreas Comunes"],
    [["cowork", "co-work"], "Coworking"],
    [["jardín", "jardin", "garden"], "Jardín"],
    [["lavandería", "lavanderia", "laundry"], "Lavandería"],
    [["bodega", "storage"], "Bodega"],
  ];

  const allText = `${desc} ${title}`;
  for (const [keywords, canonical] of AMENITY_KEYWORDS) {
    if (keywords.some((kw) => allText.includes(kw))) {
      amenities.push(canonical);
    }
  }
  // Also check features labels
  if (features) {
    for (const [, feat] of Object.entries(features)) {
      const label = feat.label.toLowerCase();
      for (const [keywords, canonical] of AMENITY_KEYWORDS) {
        if (!amenities.includes(canonical) && keywords.some((kw) => label.includes(kw))) {
          amenities.push(canonical);
        }
      }
    }
  }

  return { is_furnished, maintenance_fee, deposit_months, pets_allowed, is_short_term, utilities_included, amenities };
}

export function mapToRawListing(item: ApifyI24Listing): RawListing {
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

  const areaConstruccion = getFeatureValue(
    item.main_features,
    "superficie construí",
    "construida",
  );
  const areaTerreno = getFeatureValue(
    item.main_features,
    "superficie del terreno",
    "superficie terreno",
  );
  // Fallback: generic "superficie" or "terreno" label
  const areaFallback = !areaConstruccion && !areaTerreno
    ? (getFeatureValue(item.main_features, "terreno") ??
       getFeatureValue(item.main_features, "superficie"))
    : null;

  const propType = mapPropertyType(item.real_estate_type?.name);
  const ac = areaConstruccion ?? (propType !== "terreno" ? areaFallback : null);
  const at = areaTerreno ?? (propType === "terreno" ? areaFallback : null);
  const listingType = mapListingType(op?.operation_type?.name);

  // Extract rental attributes for renta listings
  const rentalAttrs = listingType === "renta" ? extractI24RentalAttrs(item) : null;

  return {
    source_portal: PORTAL,
    external_id: String(item.posting_id),
    external_url: item.url.startsWith("http")
      ? item.url
      : `https://www.inmuebles24.com${item.url}`,
    title: item.title ? item.title.replace(/&sup2;/g, '²').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : null,
    description: item.description_normalized ? item.description_normalized.replace(/&sup2;/g, '²').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : null,
    property_type: propType,
    listing_type: listingType,
    price_mxn: priceMxn,
    price_usd: priceUsd,
    area_m2: ac ?? at,
    area_construccion_m2: ac,
    area_terreno_m2: at,
    bedrooms: getFeatureValue(item.main_features, "recámara", "recamara"),
    bathrooms: getFeatureValue(item.main_features, "baño", "bano"),
    parking: getFeatureValue(item.main_features, "estacionamiento"),
    lat: geo?.latitude ?? null,
    lng: geo?.longitude ?? null,
    address: address || null,
    images,
    raw_data: item as unknown as Record<string, unknown>,
    // Rental attributes
    ...(rentalAttrs ? {
      is_furnished: rentalAttrs.is_furnished,
      maintenance_fee: rentalAttrs.maintenance_fee,
      deposit_months: rentalAttrs.deposit_months,
      pets_allowed: rentalAttrs.pets_allowed,
      is_short_term: rentalAttrs.is_short_term,
      utilities_included: rentalAttrs.utilities_included,
      amenities: rentalAttrs.amenities,
    } : {}),
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

    const items = await runApifyActorBatched<ApifyI24Listing>(
      ACTOR_ID,
      {
        urls,
        max_items_per_url: 50,
        max_retries_per_url: 5,
        ignore_url_failures: true,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
          apifyProxyCountry: "MX",
        },
      },
      { batchSize: 5, delayMs: 60_000 },
    );

    const listings = items.map(mapToRawListing);
    console.log(`[inmuebles24] Mapped ${listings.length} listings from Apify`);

    return listings;
  },
};
