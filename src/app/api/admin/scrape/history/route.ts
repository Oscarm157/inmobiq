import { NextResponse, type NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseClient } from "@/scraper/db";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  // Auth check
  const check = await verifyAdmin();
  if (!check.isAdmin) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const sb = getSupabaseClient();

  const { data, error, count } = await sb
    .from("scrape_jobs")
    .select("id, url, status, error_message, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ error: "Error cargando historial" }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
