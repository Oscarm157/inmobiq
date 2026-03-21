"use client"

import { useState, useRef, useEffect } from "react"
import { Icon } from "@/components/icon"

type ExportFormat = "zone-pdf" | "risk-pdf" | "listings-excel" | "listings-csv"

interface ExportButtonProps {
  /** Slug of the zone (required for zone-pdf export) */
  zoneSlug?: string
  /** Extra filters passed to the listings export endpoint */
  listingsFilters?: Record<string, string | number>
  /** Which export options to show */
  formats?: ExportFormat[]
}

const FORMAT_LABELS: Record<ExportFormat, { label: string; icon: string; desc: string }> = {
  "zone-pdf": { label: "Reporte PDF", icon: "picture_as_pdf", desc: "Métricas y análisis de la zona" },
  "risk-pdf": { label: "Reporte de Riesgo PDF", icon: "picture_as_pdf", desc: "Indicadores de riesgo por zona" },
  "listings-excel": { label: "Listado Excel", icon: "table_chart", desc: "Propiedades con todos los campos" },
  "listings-csv": { label: "Datos CSV", icon: "csv", desc: "Datos crudos para análisis" },
}

export function ExportButton({
  zoneSlug,
  listingsFilters = {},
  formats = ["zone-pdf", "listings-excel", "listings-csv"],
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleExport(fmt: ExportFormat) {
    if (loading) return
    setLoading(fmt)
    setOpen(false)

    try {
      let url: string
      let fetchOpts: RequestInit

      if (fmt === "zone-pdf") {
        url = "/api/export/zone-report"
        fetchOpts = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zone_slug: zoneSlug }),
        }
      } else if (fmt === "risk-pdf") {
        url = "/api/export/risk-report"
        fetchOpts = { method: "POST", headers: { "Content-Type": "application/json" } }
      } else {
        url = "/api/export/listings"
        fetchOpts = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format: fmt === "listings-csv" ? "csv" : "excel",
            filters: { ...(zoneSlug ? { zone_slug: zoneSlug } : {}), ...listingsFilters },
          }),
        }
      }

      const res = await fetch(url, fetchOpts)
      if (!res.ok) throw new Error(`Error ${res.status}`)

      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const cd = res.headers.get("Content-Disposition") ?? ""
      const match = cd.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? "inmobiq-export"

      const a = document.createElement("a")
      a.href = objUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      console.error("Export error:", err)
    } finally {
      setLoading(null)
    }
  }

  const visibleFormats = formats.filter((f) => {
    if (f === "zone-pdf" && !zoneSlug) return false
    return true
  })


  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!loading}
        className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Generando…
          </>
        ) : (
          <>
            <Icon name="ios_share" className="text-sm" />
            Exportar
            <Icon name="expand_more" className="text-sm" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Formato de exportación
          </p>
          {visibleFormats.map((fmt) => {
            const { label, icon, desc } = FORMAT_LABELS[fmt]
            return (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-slate-700 text-xl mt-0.5">{icon}</span>
                <span>
                  <span className="block text-sm font-bold text-slate-800">{label}</span>
                  <span className="block text-xs text-slate-500">{desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
