import { NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimit } from "@/lib/rate-limit"

export async function POST() {
  // Auth check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Rate limit: 10 exports per hour per user
  const limited = rateLimit(`export-risk:${user.id}`, 10, 3_600_000)
  if (limited) return limited

  const riskData = await getZoneRiskMetrics()
  const sorted = [...riskData].sort((a, b) => a.risk_score - b.risk_score)
  const now = new Date()
  const dateStr = now.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(220, 38, 38) // red-600
  doc.rect(0, 0, pageW, 28, "F")
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("INMOBIQ", margin, 12)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Análisis de Riesgo de Inversión · Tijuana, México", margin, 19)
  doc.text(dateStr, pageW - margin, 19, { align: "right" })

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("Reporte de Riesgo por Zona", margin, 44)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  doc.text(`Generado el ${dateStr} · ${sorted.length} zonas analizadas`, margin, 51)

  // ── Summary KPIs ──────────────────────────────────────────────────────────────
  const avgRisk = Math.round(riskData.reduce((s, r) => s + r.risk_score, 0) / riskData.length)
  const avgCap = (riskData.reduce((s, r) => s + r.cap_rate, 0) / riskData.length).toFixed(1)
  const avgVacancy = (riskData.reduce((s, r) => s + r.vacancy_rate, 0) / riskData.length).toFixed(1)

  const kpis = [
    { label: "Risk Score Prom.", value: `${avgRisk}/100` },
    { label: "Cap Rate Prom.", value: `${avgCap}%` },
    { label: "Vacancia Prom.", value: `${avgVacancy}%` },
    { label: "Zonas Analizadas", value: `${sorted.length}` },
  ]

  const boxW = contentW / 4 - 2
  kpis.forEach((kpi, i) => {
    const x = margin + i * (boxW + 2.67)
    const y = 58
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(x, y, boxW, 22, 2, 2, "F")
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text(kpi.label.toUpperCase(), x + boxW / 2, y + 7, { align: "center" })
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    doc.text(kpi.value, x + boxW / 2, y + 16, { align: "center" })
  })

  // ── Risk table ────────────────────────────────────────────────────────────────
  let y = 90
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Indicadores por Zona (Ordenado: Menor a Mayor Riesgo)", margin, y)
  y += 6
  doc.setFillColor(220, 38, 38)
  doc.rect(margin, y, contentW, 0.5, "F")
  y += 6

  const headers = ["Zona", "Risk Score", "Volatilidad", "Cap Rate", "Vacancia", "Liquidez", "Madurez", "Nivel"]
  const colW = [38, 20, 22, 18, 18, 18, 24, 16]
  let cx = margin + 2

  // Header row
  doc.setFillColor(220, 38, 38)
  doc.rect(margin, y - 4, contentW, 8, "F")
  headers.forEach((h, i) => {
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(h, cx, y + 1)
    cx += colW[i]
  })
  y += 9

  sorted.forEach((r, ri) => {
    if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y - 4, contentW, 8, "F")
    }
    cx = margin + 2
    const riskColor: [number, number, number] =
      r.risk_label === "Bajo" ? [22, 163, 74] : r.risk_label === "Medio" ? [217, 119, 6] : [220, 38, 38]
    const cells = [
      r.zone_name,
      r.risk_score.toString(),
      `${r.volatility}%`,
      `${r.cap_rate}%`,
      `${r.vacancy_rate}%`,
      `${r.liquidity_score}/100`,
      r.market_maturity,
      r.risk_label,
    ]
    cells.forEach((cell, ci) => {
      doc.setFontSize(7.5)
      doc.setFont("helvetica", ci === 7 ? "bold" : "normal")
      if (ci === 7) {
        doc.setTextColor(...riskColor)
      } else {
        doc.setTextColor(30, 30, 30)
      }
      doc.text(cell, cx, y + 1)
      cx += colW[ci]
    })
    y += 9
  })

  // ── Metodología ───────────────────────────────────────────────────────────────
  y += 6
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Nota Metodológica", margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)
  const noteLines = doc.splitTextToSize(
    "El índice de riesgo Inmobiq combina: volatilidad histórica de precios, tasa de capitalización, vacancia estimada, liquidez de mercado y madurez del mercado local. Rangos: Bajo < 40, Medio 40-65, Alto > 65.",
    contentW
  )
  doc.text(noteLines, margin, y)

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(241, 245, 249)
  doc.rect(0, pageH - 14, pageW, 14, "F")
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  doc.text("Inmobiq · Datos actualizados semanalmente · inmobiq.com", pageW / 2, pageH - 5, { align: "center" })

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inmobiq-riesgo-${now.toISOString().split("T")[0]}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
