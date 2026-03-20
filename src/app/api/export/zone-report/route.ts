import { NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { getZoneBySlug, getCityMetrics } from "@/lib/data/zones"
import { formatCurrency, formatPercent } from "@/lib/utils"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { zone_slug } = body as { zone_slug?: string }

  if (!zone_slug) {
    return NextResponse.json({ error: "zone_slug required" }, { status: 400 })
  }

  const [zone, city] = await Promise.all([getZoneBySlug(zone_slug), getCityMetrics()])
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 })
  }

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

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(29, 78, 216) // blue-700
  doc.rect(0, 0, pageW, 28, "F")

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("INMOBIQ", margin, 12)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Inteligencia del Mercado Inmobiliario · Tijuana, México", margin, 19)
  doc.text(dateStr, pageW - margin, 19, { align: "right" })

  // ── Title ───────────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text(`Reporte de Zona: ${zone.zone_name}`, margin, 44)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text(
    `Análisis estratégico generado el ${dateStr}`,
    margin,
    51
  )

  // ── KPI boxes ───────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Precio/m²", value: formatCurrency(zone.avg_price_per_m2) },
    { label: "Tendencia", value: formatPercent(zone.price_trend_pct) },
    { label: "Inventario", value: zone.total_listings.toString() },
    { label: "Ticket Promedio", value: formatCurrency(zone.avg_ticket) },
  ]

  const boxW = contentW / 4 - 2
  kpis.forEach((kpi, i) => {
    const x = margin + i * (boxW + 2.67)
    const y = 58
    doc.setFillColor(241, 245, 249) // slate-100
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

  // ── Comparativa ciudad ───────────────────────────────────────────────────────
  let y = 90
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Comparativa vs Ciudad", margin, y)
  y += 6

  doc.setFillColor(29, 78, 216)
  doc.rect(margin, y, contentW, 0.5, "F")
  y += 6

  const cityAvg = city.avg_price_per_m2
  const diffFromCity = ((zone.avg_price_per_m2 - cityAvg) / cityAvg) * 100
  const compRows = [
    ["Métrica", "Zona", "Ciudad", "Diferencia"],
    [
      "Precio/m²",
      formatCurrency(zone.avg_price_per_m2),
      formatCurrency(cityAvg),
      `${diffFromCity >= 0 ? "+" : ""}${diffFromCity.toFixed(1)}%`,
    ],
    [
      "Total Listings",
      zone.total_listings.toString(),
      city.total_listings.toString(),
      `${(((zone.total_listings - city.total_listings / city.total_zones) / (city.total_listings / city.total_zones)) * 100).toFixed(1)}%`,
    ],
    [
      "Tendencia Precio",
      formatPercent(zone.price_trend_pct),
      formatPercent(city.price_trend_pct),
      `${(zone.price_trend_pct - city.price_trend_pct).toFixed(1)} pp`,
    ],
  ]

  const colW = [55, 42, 42, 35]
  const startX = margin
  compRows.forEach((row, ri) => {
    const isHeader = ri === 0
    if (isHeader) {
      doc.setFillColor(29, 78, 216)
      doc.rect(startX, y - 4, contentW, 8, "F")
    } else if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(startX, y - 4, contentW, 8, "F")
    }
    let cx = startX + 2
    row.forEach((cell, ci) => {
      doc.setFontSize(8)
      doc.setFont("helvetica", isHeader ? "bold" : "normal")
      doc.setTextColor(isHeader ? 255 : 30, isHeader ? 255 : 30, isHeader ? 255 : 30)
      doc.text(cell, cx, y + 1)
      cx += colW[ci]
    })
    y += 9
  })

  // ── Distribución por tipo ────────────────────────────────────────────────────
  y += 6
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Distribución por Tipo de Propiedad", margin, y)
  y += 6

  doc.setFillColor(29, 78, 216)
  doc.rect(margin, y, contentW, 0.5, "F")
  y += 6

  const typeLabels: Record<string, string> = {
    casa: "Casas",
    departamento: "Departamentos",
    terreno: "Terrenos",
    local: "Locales",
    oficina: "Oficinas",
  }
  const typeColors: [number, number, number][] = [
    [29, 78, 216],
    [99, 102, 241],
    [236, 72, 153],
    [245, 158, 11],
    [16, 185, 129],
  ]

  const types = Object.entries(zone.listings_by_type).sort(([, a], [, b]) => b - a)
  const total = types.reduce((s, [, n]) => s + n, 0)
  const barMaxW = contentW - 60

  types.forEach(([type, count], idx) => {
    const pct = total > 0 ? (count / total) * 100 : 0
    const barW = (pct / 100) * barMaxW
    const [r, g, b] = typeColors[idx % typeColors.length]

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(30, 30, 30)
    doc.text(typeLabels[type] ?? type, margin, y + 4)

    doc.setFillColor(r, g, b)
    doc.roundedRect(margin + 30, y, barW > 0 ? barW : 0.5, 5, 1, 1, "F")

    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(`${count} (${pct.toFixed(0)}%)`, margin + 30 + barW + 3, y + 4)

    y += 9
  })

  // ── Análisis de tickets por tipo ─────────────────────────────────────────────
  const hasTickets = Object.keys(zone.avg_ticket_by_type ?? {}).length > 0
  if (hasTickets) {
    y += 4
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    doc.text("Ticket Promedio por Tipo", margin, y)
    y += 6
    doc.setFillColor(29, 78, 216)
    doc.rect(margin, y, contentW, 0.5, "F")
    y += 6

    Object.entries(zone.avg_ticket_by_type)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, ticket]) => {
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(30, 30, 30)
        doc.text(typeLabels[type] ?? type, margin, y + 4)
        doc.setFont("helvetica", "bold")
        doc.text(formatCurrency(ticket), margin + 80, y + 4)
        y += 8
      })
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(241, 245, 249)
  doc.rect(0, pageH - 14, pageW, 14, "F")
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  doc.text(
    "Inmobiq · Datos actualizados semanalmente · inmobiq.com",
    pageW / 2,
    pageH - 5,
    { align: "center" }
  )

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inmobiq-zona-${zone_slug}-${now.toISOString().split("T")[0]}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
