import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
];

const TIMEOUT_MS = 15_000;

export interface FetchResult {
  html: string;
  $: cheerio.CheerioAPI;
  finalUrl: string;
  statusCode: number;
}

/**
 * Fetch a page using Axios + Cheerio (works on Vercel).
 * Returns parsed HTML and Cheerio instance.
 */
export async function fetchPage(url: string): Promise<FetchResult> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const parsedUrl = new URL(url);

  const response = await axios.get(url, {
    headers: {
      "User-Agent": ua,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer: `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
      "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    timeout: TIMEOUT_MS,
    maxRedirects: 5,
    responseType: "text",
    // Don't throw on 4xx/5xx — let us handle it
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
}
