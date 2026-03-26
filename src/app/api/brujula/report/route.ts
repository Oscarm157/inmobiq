import { NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"
import type { ValuationResult, ValuationVerdict } from "@/types/database"

function formatMxn(n: number): string {
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
}

const VERDICT_COLORS: Record<ValuationVerdict, [number, number, number]> = {
  muy_barata: [5, 150, 105],   // emerald-600
  barata: [22, 163, 74],       // green-600
  precio_justo: [217, 119, 6], // amber-600
  cara: [234, 88, 12],         // orange-600
  muy_cara: [220, 38, 38],     // red-600
}

const VERDICT_LABELS: Record<ValuationVerdict, string> = {
  muy_barata: "MUY BARATO",
  barata: "BARATO",
  precio_justo: "PRECIO JUSTO",
  cara: "CARO",
  muy_cara: "MUY CARO",
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const limited = await rateLimit(`brujula-pdf:${user.id}`, 20, 3_600_000)
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const { valuationId } = body as { valuationId?: string }

  if (!valuationId) {
    return NextResponse.json({ error: "valuationId required" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: valuation } = await sb
    .from("valuations")
    .select("*")
    .eq("id", valuationId)
    .eq("user_id", user.id)
    .single()

  if (!valuation || valuation.status !== "completed" || !valuation.valuation_result || !valuation.verdict) {
    return NextResponse.json({ error: "Valuación no encontrada o incompleta" }, { status: 404 })
  }

  const r = valuation.valuation_result as ValuationResult
  const verdict = valuation.verdict as ValuationVerdict
  const narrative = (valuation.narrative as string | null) ?? ""
  const headerColor = VERDICT_COLORS[verdict] ?? [29, 78, 216]

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2
  const now = new Date()
  const dateStr = now.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // ── Header bar ──
  doc.setFillColor(...headerColor)
  doc.rect(0, 0, pageW, 28, "F")

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("INMOBIQ BRUJULA", margin, 12)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Reporte de Valuacion de Propiedad", margin, 19)
  doc.text(dateStr, pageW - margin, 19, { align: "right" })

  // ── Verdict section ──
  let y = 38
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...headerColor)
  doc.text(`${VERDICT_LABELS[verdict]} — Score ${r.score}/100`, margin, y)

  y += 8
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  doc.text(`Zona: ${r.zone_name}`, margin, y)

  // ── Property summary ──
  y += 12
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Propiedad analizada", margin, y)

  y += 7
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)

  const propLines = [
    `Tipo: ${valuation.property_type ?? "—"} en ${valuation.listing_type ?? "—"}`,
    `Precio: ${valuation.price_mxn ? formatMxn(valuation.price_mxn) : "—"} MXN`,
    `Superficie: ${valuation.area_m2 ?? "—"} m²`,
    `Precio/m²: ${formatMxn(r.price_per_m2)}`,
  ]
  if (valuation.bedrooms) propLines.push(`Recámaras: ${valuation.bedrooms}`)
  if (valuation.bathrooms) propLines.push(`Baños: ${valuation.bathrooms}`)
  if (valuation.address) propLines.push(`Dirección: ${valuation.address}`)

  for (const line of propLines) {
    doc.text(line, margin, y)
    y += 5
  }

  // ── KPI boxes ──
  y += 6
  const kpis = [
    { label: "Precio/m²", value: formatMxn(r.price_per_m2), sub: `Zona: ${formatMxn(r.zone_avg_price_per_m2)}` },
    { label: "Percentil", value: `${r.price_percentile}`, sub: `De 100 propiedades` },
    { label: "Tendencia", value: `${r.price_trend_pct > 0 ? "+" : ""}${r.price_trend_pct.toFixed(1)}%`, sub: "Semanal" },
    { label: "Liquidez", value: `${r.liquidity_score}/100`, sub: "" },
  ]

  const boxW = (contentW - 6) / 4
  for (let i = 0; i < kpis.length; i++) {
    const x = margin + i * (boxW + 2)
    doc.setFillColor(248, 250, 252) // slate-50
    doc.roundedRect(x, y, boxW, 22, 2, 2, "F")

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(148, 163, 184)
    doc.text(kpis[i].label.toUpperCase(), x + 3, y + 6)

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    doc.text(kpis[i].value, x + 3, y + 14)

    if (kpis[i].sub) {
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(148, 163, 184)
      doc.text(kpis[i].sub, x + 3, y + 19)
    }
  }

  // ── Comparison table ──
  y += 30
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Comparativa", margin, y)

  y += 6
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(148, 163, 184)
  doc.text("METRICA", margin, y)
  doc.text("PROPIEDAD", margin + 50, y)
  doc.text("ZONA", margin + 95, y)
  doc.text("DIFERENCIA", margin + 130, y)

  y += 5
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)

  const rows = [
    ["Precio/m²", formatMxn(r.price_per_m2), formatMxn(r.zone_avg_price_per_m2), `${r.price_premium_pct > 0 ? "+" : ""}${r.price_premium_pct.toFixed(1)}%`],
    ["Precio total", valuation.price_mxn ? formatMxn(valuation.price_mxn) : "—", formatMxn(r.zone_avg_ticket), "—"],
  ]

  for (const row of rows) {
    doc.text(row[0], margin, y)
    doc.text(row[1], margin + 50, y)
    doc.text(row[2], margin + 95, y)
    doc.text(row[3], margin + 130, y)
    y += 5
  }

  // ── Narrative ──
  if (narrative) {
    y += 8
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    doc.text("Analisis", margin, y)

    y += 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(71, 85, 105)

    const lines = doc.splitTextToSize(narrative, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 4
  }

  // ── Verdict reasons ──
  y += 8
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Factores del veredicto", margin, y)

  y += 6
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)

  for (const reason of r.verdict_reasons) {
    doc.text(`• ${reason}`, margin, y)
    y += 5
  }

  // ── Footer ──
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(
    "Generado por Inmobiq Brujula — inmobiq.com — Este reporte es orientativo y no constituye asesoria de inversion.",
    margin,
    pageH - 10,
  )

  const pdfBytes = doc.output("arraybuffer")
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="brujula-${r.zone_slug}-${dateStr}.pdf"`,
    },
  })
}
