import type { SourcePortal } from "@/types/database";
import { createHash } from "crypto";

const PORTAL_HOSTNAMES: Record<string, SourcePortal> = {
  "inmuebles24.com": "inmuebles24",
  "www.inmuebles24.com": "inmuebles24",
  "lamudi.com.mx": "lamudi",
  "www.lamudi.com.mx": "lamudi",
  "vivanuncios.com.mx": "vivanuncios",
  "www.vivanuncios.com.mx": "vivanuncios",
  "inmuebles.mercadolibre.com.mx": "mercadolibre",
  "www.mercadolibre.com.mx": "mercadolibre",
  "propiedades.com": "otro",
  "www.propiedades.com": "otro",
  "century21mexico.com": "otro",
  "www.century21mexico.com": "otro",
  "century21.com.mx": "otro",
  "www.century21.com.mx": "otro",
};

/**
 * Detect source portal from URL hostname.
 * Returns 'otro' for unknown portals.
 */
export function detectPortal(url: string): SourcePortal {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PORTAL_HOSTNAMES[hostname] ?? "otro";
  } catch {
    return "otro";
  }
}

/**
 * Generate a stable external_id from URL.
 * For known portals, extracts the last path segment.
 * For unknown portals, hashes the full pathname.
 */
export function generateExternalId(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    // If last segment looks like an ID (has numbers), use it
    if (lastSegment && /\d/.test(lastSegment)) {
      return lastSegment;
    }

    // Otherwise hash the pathname for a stable ID
    return createHash("md5").update(parsed.pathname).digest("hex").slice(0, 16);
  } catch {
    return createHash("md5").update(url).digest("hex").slice(0, 16);
  }
}
