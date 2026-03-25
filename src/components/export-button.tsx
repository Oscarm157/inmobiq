"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirectedFrom=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After")
          const secs = retryAfter ? parseInt(retryAfter, 10) : 60
          setError(`Límite alcanzado. Intenta en ${Math.ceil(secs / 60)} min.`)
          setTimeout(() => setError(null), 5000)
          return
        }
        throw new Error(`Error ${res.status}`)
      }

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
    } catch {
      setError("Error al exportar. Intenta de nuevo.")
      setTimeout(() => setError(null), 5000)
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

      {error && (
        <div className="absolute right-0 mt-2 w-60 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-red-200 dark:border-red-800 z-50">
          {error}
        </div>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Formato de exportación
          </p>
          {visibleFormats.map((fmt) => {
            const { label, icon, desc } = FORMAT_LABELS[fmt]
            return (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-xl mt-0.5">{icon}</span>
                <span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
