import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
  const response = await axios.get(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
    timeout: TIMEOUT_MS,
    maxRedirects: 5,
    responseType: "text",
  });

  const html = response.data as string;
  const $ = cheerio.load(html);

  return {
    html,
    $,
    finalUrl: response.request?.res?.responseUrl ?? url,
    statusCode: response.status,
  };
}
