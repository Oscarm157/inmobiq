"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"

export interface DrillDownListing {
  id: string
  title: string
  property_type: string
  listing_type: string
  price: number
  area_m2: number
  area_construccion_m2?: number | null
  area_terreno_m2?: number | null
  price_per_m2: number
  bedrooms: number | null
  bathrooms: number | null
  source: string
  source_url: string
}

interface DrillDownPanelProps {
  listings: DrillDownListing[]
  label: string
  zoneSlug: string
  chartType: string
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa", departamento: "Depto", terreno: "Terreno", local: "Local", oficina: "Oficina",
}

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

export function DrillDownPanel({ listings, label, zoneSlug, chartType, onClose }: DrillDownPanelProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState("")
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleReport = async () => {
    if (!reportText.trim()) return
    setReportStatus("sending")
    try {
      const res = await fetch("/api/data-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_slug: zoneSlug,
          chart_type: chartType,
          chart_context: {
            label,
            listing_ids: listings.map((l) => l.id),
            listing_count: listings.length,
            filters: typeof window !== "undefined" ? window.location.search : "",
          },
          description: reportText,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setReportStatus("sent")
      setReportText("")
      setTimeout(() => { setReportStatus("idle"); setReportOpen(false) }, 2000)
    } catch {
      setReportStatus("error")
    }
  }

  if (!listings.length) return null

  return (
    <div className="mt-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <Icon name="bug_report" className="text-amber-600 text-sm" />
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
            DEV · {label} · {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportOpen(!reportOpen)}
            className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 flex items-center gap-1"
          >
            <Icon name="flag" className="text-xs" />
            Reportar
          </button>
          <button onClick={onClose} className="text-amber-500 hover:text-amber-700">
            <Icon name="close" className="text-sm" />
          </button>
        </div>
      </div>

      {/* Report form */}
      {reportOpen && (
        <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800 bg-amber-100/30 dark:bg-amber-900/20">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe el problema con estos datos..."
            className="w-full text-xs p-2 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-slate-800 resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-amber-500">
              Se enviará con contexto: zona, gráfica, rango, IDs de listings
            </span>
            <button
              onClick={handleReport}
              disabled={reportStatus === "sending" || !reportText.trim()}
              className="text-[10px] font-bold px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {reportStatus === "sending" ? "Enviando..." : reportStatus === "sent" ? "Enviado" : reportStatus === "error" ? "Error — reintentar" : "Enviar reporte"}
            </button>
          </div>
        </div>
      )}

      {/* Listings table */}
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-amber-50 dark:bg-amber-950/50">
            <tr className="text-left text-amber-600 dark:text-amber-400 font-bold">
              <th className="px-3 py-1.5">Tipo</th>
              <th className="px-3 py-1.5">Op</th>
              <th className="px-3 py-1.5">Título</th>
              <th className="px-3 py-1.5 text-right">Precio</th>
              <th className="px-3 py-1.5 text-right">m²</th>
              <th className="px-3 py-1.5 text-right">$/m²</th>
              <th className="px-3 py-1.5">Rec</th>
              <th className="px-3 py-1.5">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-t border-amber-100 dark:border-amber-900/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/30">
                <td className="px-3 py-1.5 font-medium">{TYPE_LABELS[l.property_type] ?? l.property_type}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    l.listing_type === "venta"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                  }`}>
                    {l.listing_type === "venta" ? "V" : "R"}
                  </span>
                </td>
                <td className="px-3 py-1.5 max-w-[180px] truncate">{l.title}</td>
                <td className="px-3 py-1.5 text-right font-mono">{formatPrice(l.price)}</td>
                <td className="px-3 py-1.5 text-right font-mono" title={l.property_type === "casa" && l.area_construccion_m2 && l.area_terreno_m2 ? `Constr: ${Math.round(l.area_construccion_m2)}m² · Terr: ${Math.round(l.area_terreno_m2)}m²` : undefined}>{l.area_m2 > 0 ? `${Math.round(l.area_m2)}${l.property_type === "casa" && l.area_terreno_m2 && l.area_construccion_m2 && l.area_terreno_m2 !== l.area_construccion_m2 ? `/${Math.round(l.area_terreno_m2)}` : ""}` : "—"}</td>
                <td className="px-3 py-1.5 text-right font-mono">{l.price_per_m2 > 0 ? formatPrice(Math.round(l.price_per_m2)) : "—"}</td>
                <td className="px-3 py-1.5 text-center">{l.bedrooms ?? "—"}</td>
                <td className="px-3 py-1.5">
                  {l.source_url && l.source_url !== "#" ? (
                    <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {l.source}
                    </a>
                  ) : (
                    <span className="text-slate-400">{l.source}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
