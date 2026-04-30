"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import { useAuth } from "@/contexts/auth-context"
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

const VERDICT_CONFIG: Record<ValuationVerdict, { label: string; scoreColor: string; chipClass: string; iconBg: string; bar: string }> = {
  muy_barata: {
    label: "Muy barato",
    scoreColor: "text-emerald-600 dark:text-emerald-400",
    chipClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    bar: "bg-emerald-500",
  },
  barata: {
    label: "Barato",
    scoreColor: "text-green-600 dark:text-green-400",
    chipClass: "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    iconBg: "bg-green-50 dark:bg-green-900/30",
    bar: "bg-green-500",
  },
  precio_justo: {
    label: "Precio justo",
    scoreColor: "text-amber-600 dark:text-amber-400",
    chipClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    bar: "bg-amber-400",
  },
  cara: {
    label: "Caro",
    scoreColor: "text-orange-600 dark:text-orange-400",
    chipClass: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    bar: "bg-orange-400",
  },
  muy_cara: {
    label: "Muy caro",
    scoreColor: "text-red-600 dark:text-red-400",
    chipClass: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    iconBg: "bg-red-50 dark:bg-red-900/30",
    bar: "bg-red-500",
  },
}

const TYPE_ICONS: Record<PropertyType, string> = {
  casa: "home",
  departamento: "apartment",
  terreno: "landscape",
  local: "store",
  oficina: "business",
}

const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

function formatMxn(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" })
}

function formatZone(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
}

export function ValuationHistory() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    fetch("/api/brujula/history")
      .then((r) => {
        if (r.status === 401) return { valuations: [] }
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => { if (!cancelled) setItems(d.valuations ?? []) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [authLoading, user])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center">
        <Icon name="history" className="text-3xl text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-500">No se pudo cargar el historial</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center">
        <Icon name="explore" className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin valuaciones aún</p>
        <p className="text-xs text-slate-400 mt-1">Usa el formulario de arriba para valuar tu primera propiedad.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Historial
        </h3>
        <span className="text-xs text-slate-400 font-medium">{items.length} valuaciones</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {items.map((item) => {
          const cfg = item.verdict ? VERDICT_CONFIG[item.verdict] : null
          const zone = item.zone_slug ? formatZone(item.zone_slug) : "—"
          const typeLabel = item.property_type ? TYPE_LABELS[item.property_type] : "Propiedad"
          const typeIcon = item.property_type ? TYPE_ICONS[item.property_type] : "home"

          return (
            <motion.div key={item.id} variants={itemVariants}>
              <motion.div whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 20 } }}>
                <Link
                  href={`/brujula/${item.id}`}
                  className="group block bg-surface rounded-2xl p-5 card-shadow hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      cfg ? cfg.iconBg : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      <Icon
                        name={typeIcon}
                        className={`text-xl ${cfg ? cfg.scoreColor : "text-slate-400"}`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                            {zone}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {typeLabel} · {item.price_mxn ? formatMxn(item.price_mxn) : "—"} · {item.area_m2 ?? "—"} m²
                          </p>
                        </div>
                        {/* Score */}
                        {item.score !== null && cfg && (
                          <span className={`text-2xl font-black flex-shrink-0 leading-none ${cfg.scoreColor}`}>
                            {item.score}
                          </span>
                        )}
                      </div>

                      {/* Score bar */}
                      {item.score !== null && cfg && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${cfg.bar}`}
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ type: "spring", stiffness: 180, damping: 24, delay: 0.2 }}
                            />
                          </div>
                          {cfg && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.chipClass}`}>
                              {cfg.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatDate(item.created_at)} · {item.input_mode === "screenshots" ? "Screenshot" : "Manual"}
                        </p>
                        <span className="text-[10px] font-bold text-blue-500 group-hover:text-blue-600 transition-colors flex items-center gap-0.5">
                          Ver reporte
                          <Icon name="chevron_right" className="text-xs" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
