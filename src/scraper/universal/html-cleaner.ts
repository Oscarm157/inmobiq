import * as cheerio from "cheerio";

const REMOVE_TAGS = ["script", "style", "nav", "footer", "header", "noscript", "iframe", "svg"];
const MAX_CHARS = 60_000; // ~15k tokens for Claude

/**
 * Clean HTML for AI extraction.
 * Removes scripts, styles, nav, etc. Keeps main content area.
 * Truncates to MAX_CHARS to control token costs.
 */
export function cleanHtmlForAI(html: string): string {
  const $ = cheerio.load(html);

  // Remove noise tags
  for (const tag of REMOVE_TAGS) {
    $(tag).remove();
  }

  // Remove data attributes and inline styles to reduce size
  $("*").each(function () {
    const el = $(this);
    const attribs = (this as unknown as { attribs?: Record<string, string> }).attribs ?? {};
    for (const attr of Object.keys(attribs)) {
      if (attr.startsWith("data-") || attr === "style" || attr === "onclick" || attr === "onload") {
        el.removeAttr(attr);
      }
    }
  });

  // Prefer main/article content if available
  const main = $("main").html() ?? $("article").html() ?? $("[role='main']").html();
  let content: string;

  if (main && main.length > 200) {
    content = main;
  } else {
    content = $("body").html() ?? $.html();
  }

  // Collapse whitespace
  content = content.replace(/\s+/g, " ").trim();

  // Truncate
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS);
  }

  return content;
}
