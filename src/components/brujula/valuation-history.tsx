"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Icon } from "@/components/icon"
import type { ValuationVerdict, PropertyType } from "@/types/database"

interface HistoryItem {
  id: string
  property_type: PropertyType | null
  listing_type: string | null
  price_mxn: number | null
  area_m2: number | null
  zone_slug: string | null
  verdict: ValuationVerdict | null
  score: number | null
  input_mode: string
  created_at: string
}

const VERDICT_BADGES: Record<ValuationVerdict, { label: string; class: string }> = {
  muy_barata: { label: "Muy barato", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  barata: { label: "Barato", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  precio_justo: { label: "Precio justo", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  cara: { label: "Caro", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  muy_cara: { label: "Muy caro", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

const TYPE_ICONS: Record<PropertyType, string> = {
  casa: "home",
  departamento: "apartment",
  terreno: "landscape",
  local: "store",
  oficina: "business",
}

function formatMxn(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function ValuationHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/brujula/history")
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => setItems(d.valuations ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Cargando historial...
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-slate-400 py-4">
        No se pudo cargar el historial.
      </p>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
        Historial de valuaciones
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/brujula/${item.id}`}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Icon
                name={item.property_type ? TYPE_ICONS[item.property_type] : "home"}
                className="text-slate-500 dark:text-slate-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {item.zone_slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—"}
                </span>
                {item.verdict && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VERDICT_BADGES[item.verdict].class}`}>
                    {VERDICT_BADGES[item.verdict].label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {item.price_mxn ? formatMxn(item.price_mxn) : "—"} · {item.area_m2 ?? "—"} m² · {item.listing_type ?? "—"} ·{" "}
                {new Date(item.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" })}
              </p>
            </div>
            {item.score !== null && (
              <span className="text-lg font-black text-slate-700 dark:text-slate-300 flex-shrink-0">
                {item.score}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
