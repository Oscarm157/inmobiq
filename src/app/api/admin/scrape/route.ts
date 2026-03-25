import { NextResponse, type NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { fetchPage } from "@/scraper/universal/page-fetcher";
import { extractFromPage } from "@/scraper/universal/extractor";
import { normalizeToListing } from "@/scraper/universal/normalizer";
import { getSupabaseClient } from "@/scraper/db";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Auth check
  const check = await verifyAdmin();
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  // Rate limit: 5 scrapes per minute per admin
  const limited = rateLimit(`admin-scrape:${check.userId}`, 5, 60_000);
  if (limited) return limited;

  // Parse body
  let url: string;
  try {
    const body = await request.json();
    url = body.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }
    // Validate URL format
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const sb = getSupabaseClient();

  // Create scrape job
  const { data: job, error: jobError } = await sb
    .from("scrape_jobs")
    .insert({ user_id: check.userId, url, status: "scraping" })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Error creando job de scraping" },
      { status: 500 },
    );
  }

  const jobId = job.id as string;

  try {
    // Fetch page
    const { $, html } = await fetchPage(url);

    // Update status
    await sb
      .from("scrape_jobs")
      .update({ status: "extracting" })
      .eq("id", jobId);

    // Extract data (4 layers)
    const extraction = await extractFromPage($, html, url);

    // Normalize to listing shape
    const normalized = normalizeToListing(extraction.data, url);

    // Save extraction results to job
    await sb
      .from("scrape_jobs")
      .update({
        status: "preview",
        extracted_data: extraction.data as unknown as Record<string, unknown>,
        normalized_data: normalized as unknown as Record<string, unknown>,
      })
      .eq("id", jobId);

    return NextResponse.json({
      jobId,
      listing: normalized,
      extraction: {
        layers: extraction.layers,
        confidence: extraction.confidence,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";

    await sb
      .from("scrape_jobs")
      .update({ status: "failed", error_message: message })
      .eq("id", jobId);

    return NextResponse.json(
      { error: `Error scrapeando: ${message}`, jobId },
      { status: 500 },
    );
  }
}
