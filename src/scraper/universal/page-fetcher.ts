import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
];

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

export interface FetchResult {
  html: string;
  $: cheerio.CheerioAPI;
  finalUrl: string;
  statusCode: number;
}

/**
 * Fetch a page using Axios + Cheerio (works on Vercel).
 * Retries on timeout. Returns parsed HTML and Cheerio instance.
 */
export async function fetchPage(url: string): Promise<FetchResult> {
  const parsedUrl = new URL(url);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
        responseType: "text",
        validateStatus: (status) => status < 500,
      });

      if (response.status === 403 || response.status === 429) {
        throw new Error(
          `El sitio bloqueó la petición (${response.status}). Este portal requiere navegador completo — scrapéalo desde la terminal con Playwright.`
        );
      }

      if (response.status >= 400) {
        throw new Error(`Error HTTP ${response.status} al cargar la página`);
      }

      const html = response.data as string;
      const $ = cheerio.load(html);

      return {
        html,
        $,
        finalUrl: response.request?.res?.responseUrl ?? url,
        statusCode: response.status,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry on timeout or network errors, not on HTTP errors (403, 404, etc.)
      const isTimeout = lastError.message.includes("timeout");
      const isNetwork = "code" in (err as Record<string, unknown>) &&
        ["ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(
          (err as Record<string, unknown>).code as string
        );

      if (!isTimeout && !isNetwork) throw lastError;
      if (attempt === MAX_RETRIES) break;
    }
  }

  throw lastError ?? new Error("Error desconocido al cargar la página");
}
