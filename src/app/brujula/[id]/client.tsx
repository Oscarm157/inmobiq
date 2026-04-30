"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import { ValuationReport } from "@/components/brujula/valuation-report"
import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"

const VERDICT_CONFIG: Record<ValuationVerdict, {
  label: string
  scoreColor: string
  heroBg: string
  heroGlow: string
  chip: string
}> = {
  muy_barata: {
    label: "Muy barato",
    scoreColor: "text-emerald-500 dark:text-emerald-400",
    heroBg: "from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950",
    heroGlow: "bg-emerald-400/20 dark:bg-emerald-500/10",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  barata: {
    label: "Barato",
    scoreColor: "text-green-500 dark:text-green-400",
    heroBg: "from-green-50 via-white to-white dark:from-green-950/30 dark:via-slate-950 dark:to-slate-950",
    heroGlow: "bg-green-400/20 dark:bg-green-500/10",
    chip: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
  precio_justo: {
    label: "Precio justo",
    scoreColor: "text-amber-500 dark:text-amber-400",
    heroBg: "from-amber-50 via-white to-white dark:from-amber-950/20 dark:via-slate-950 dark:to-slate-950",
    heroGlow: "bg-amber-400/20 dark:bg-amber-500/10",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  cara: {
    label: "Caro",
    scoreColor: "text-orange-500 dark:text-orange-400",
    heroBg: "from-orange-50 via-white to-white dark:from-orange-950/20 dark:via-slate-950 dark:to-slate-950",
    heroGlow: "bg-orange-400/20 dark:bg-orange-500/10",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  muy_cara: {
    label: "Muy caro",
    scoreColor: "text-red-500 dark:text-red-400",
    heroBg: "from-red-50 via-white to-white dark:from-red-950/20 dark:via-slate-950 dark:to-slate-950",
    heroGlow: "bg-red-400/20 dark:bg-red-500/10",
    chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
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

interface Props {
  result: ValuationResult
  narrative: string
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    bedrooms: number | null
    bathrooms: number | null
    parking: number | null
    address: string | null
  }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
}

export function ValuationDetailClient({ result, narrative, property }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]

  const chips = [
    { icon: "payments", label: formatMxn(property.price_mxn) },
    { icon: "square_foot", label: `${property.area_m2} m²` },
    ...(property.bedrooms != null ? [{ icon: "bed", label: `${property.bedrooms} rec.` }] : []),
    ...(property.bathrooms != null ? [{ icon: "shower", label: `${property.bathrooms} baños` }] : []),
  ]

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="/brujula"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Icon name="arrow_back" className="text-base" />
        Brújula
      </Link>

      {/* Hero — veredicto */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.heroBg} p-8 md:p-10 border border-slate-100 dark:border-slate-800/50`}>
        {/* Glow */}
        <div className={`absolute -top-16 -right-16 w-64 h-64 ${cfg.heroGlow} rounded-full blur-3xl pointer-events-none`} />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="flex items-center gap-2 mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Reporte de valuación · {result.zone_name}
            </span>
          </motion.div>

          {/* Score + Veredicto */}
          <motion.div variants={item} className="flex items-end gap-5 mb-5">
            <span className={`text-8xl font-black leading-none ${cfg.scoreColor}`}>
              {result.score}
            </span>
            <div className="pb-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-base font-bold ${cfg.chip}`}>
                {cfg.label}
              </span>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                de 100 · percentil {result.price_percentile}
              </p>
            </div>
          </motion.div>

          {/* Property title */}
          <motion.h1 variants={item} className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-4">
            {TYPE_LABELS[property.property_type]} en {property.listing_type} · {result.zone_name}
          </motion.h1>

          {/* Property chips */}
          <motion.div variants={item} className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <Icon name={c.icon} className="text-sm text-slate-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <Icon name="trending_up" className="text-sm text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatMxn(result.price_per_m2)}/m² vs {formatMxn(result.zone_avg_price_per_m2)}/m² zona
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Report body — sin ScoreSlider (ya está en el hero) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.35 }}
      >
        <ValuationReport
          result={result}
          narrative={narrative}
          property={property}
          showScoreSlider={false}
        />
      </motion.div>
    </div>
  )
}
