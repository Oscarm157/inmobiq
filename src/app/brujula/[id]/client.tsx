"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import { ValuationReport } from "@/components/brujula/valuation-report"
import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"

const VERDICT_CONFIG: Record<ValuationVerdict, {
  label: string
  accent: string
  heroBg: string
  glow: string
  chip: string
}> = {
  muy_barata: {
    label: "Muy barato",
    accent: "text-emerald-600 dark:text-emerald-400",
    heroBg: "from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-emerald-400/20 dark:bg-emerald-500/10",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  barata: {
    label: "Barato",
    accent: "text-green-600 dark:text-green-400",
    heroBg: "from-green-50 via-white to-white dark:from-green-950/30 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-green-400/20 dark:bg-green-500/10",
    chip: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
  precio_justo: {
    label: "Precio justo",
    accent: "text-amber-600 dark:text-amber-400",
    heroBg: "from-amber-50 via-white to-white dark:from-amber-950/20 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-amber-400/20 dark:bg-amber-500/10",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  cara: {
    label: "Caro",
    accent: "text-orange-600 dark:text-orange-400",
    heroBg: "from-orange-50 via-white to-white dark:from-orange-950/20 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-orange-400/20 dark:bg-orange-500/10",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  muy_cara: {
    label: "Muy caro",
    accent: "text-red-600 dark:text-red-400",
    heroBg: "from-red-50 via-white to-white dark:from-red-950/20 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-red-400/20 dark:bg-red-500/10",
    chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
}

const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina",
}

function formatMxn(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function formatMxnSigned(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(1)}M` : abs >= 1_000 ? `$${(abs / 1_000).toFixed(0)}K` : `$${abs.toFixed(0)}`
  return n >= 0 ? `+${formatted}` : `−${formatted}`
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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
}

type StatTone = "danger" | "good" | "warn" | "neutral"

function toneClass(tone: StatTone): string {
  switch (tone) {
    case "danger": return "text-red-600 dark:text-red-400"
    case "good": return "text-emerald-600 dark:text-emerald-400"
    case "warn": return "text-amber-600 dark:text-amber-400"
    default: return "text-slate-800 dark:text-slate-100"
  }
}

export function ValuationDetailClient({ result, narrative, property }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]
  const isVenta = property.listing_type === "venta"

  // Sobreprecio absoluto (precio_per_m2 - zone_avg) * area
  const overpaidMxn = (result.price_per_m2 - result.zone_avg_price_per_m2) * property.area_m2

  const stats: { label: string; value: string; sub: string; tone: StatTone; icon: string }[] = [
    {
      label: isVenta ? "Sobreprecio" : "Diferencia",
      value: formatMxnSigned(overpaidMxn),
      sub: `${result.price_premium_pct > 0 ? "+" : ""}${result.price_premium_pct.toFixed(1)}% vs zona`,
      tone: result.price_premium_pct > 10 ? "danger" : result.price_premium_pct < -5 ? "good" : "warn",
      icon: result.price_premium_pct > 0 ? "trending_up" : "trending_down",
    },
    ...(result.cap_rate != null
      ? [{
          label: "Cap Rate zona",
          value: `${result.cap_rate.toFixed(1)}%`,
          sub: result.cap_rate >= 7 ? "atractivo" : result.cap_rate >= 5 ? "moderado" : "bajo",
          tone: (result.cap_rate >= 7 ? "good" : result.cap_rate >= 5 ? "warn" : "danger") as StatTone,
          icon: "trending_up",
        }]
      : [{
          label: "Tendencia zona",
          value: `${result.price_trend_pct > 0 ? "+" : ""}${result.price_trend_pct.toFixed(1)}%`,
          sub: "semanal",
          tone: (result.price_trend_pct > 1 ? "good" : result.price_trend_pct < -1 ? "danger" : "neutral") as StatTone,
          icon: result.price_trend_pct >= 0 ? "trending_up" : "trending_down",
        }]),
    {
      label: "Riesgo zona",
      value: `${result.risk_score}`,
      sub: result.risk_label || (result.risk_score < 40 ? "bajo" : result.risk_score < 65 ? "medio" : "alto"),
      tone: result.risk_score < 40 ? "good" : result.risk_score < 65 ? "warn" : "danger",
      icon: "shield",
    },
    {
      label: "Liquidez zona",
      value: `${result.liquidity_score}`,
      sub: result.liquidity_score >= 70 ? "fácil reventa" : result.liquidity_score >= 40 ? "reventa moderada" : "reventa lenta",
      tone: result.liquidity_score >= 70 ? "good" : result.liquidity_score >= 40 ? "warn" : "danger",
      icon: "swap_horiz",
    },
  ]

  const chips = [
    { icon: "payments", label: formatMxn(property.price_mxn) },
    { icon: "square_foot", label: `${property.area_m2} m²` },
    ...(property.bedrooms != null ? [{ icon: "bed", label: `${property.bedrooms} rec.` }] : []),
    ...(property.bathrooms != null ? [{ icon: "shower", label: `${property.bathrooms} baños` }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/brujula"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Icon name="arrow_back" className="text-base" />
        Brújula
      </Link>

      {/* Hero */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.heroBg} p-6 md:p-8 lg:p-10 border border-slate-100 dark:border-slate-800/50`}>
        <div className={`absolute -top-16 -right-16 w-64 h-64 ${cfg.glow} rounded-full blur-3xl pointer-events-none`} />

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
          {/* Left — main content */}
          <div className="min-w-0">
            <motion.p variants={fadeUp} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Reporte de valuación · {result.zone_name}
            </motion.p>

            {/* Veredicto + percentil */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-base font-bold ${cfg.chip}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                percentil {result.price_percentile} · más caro que el {result.price_percentile}% de la zona
              </span>
            </motion.div>

            {/* Property title */}
            <motion.h1 variants={fadeUp} className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight text-slate-900 dark:text-slate-100">
              {TYPE_LABELS[property.property_type]} en {property.listing_type}
              <span className={cfg.accent}> · {result.zone_name}</span>
            </motion.h1>

            {/* Property chips */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-5">
              {chips.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <Icon name={c.icon} className="text-sm text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Price comparison line */}
            <motion.div variants={fadeUp} className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/50 inline-flex">
              <Icon name="balance" className="text-base text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMxn(result.price_per_m2)}/m²</span>
                <span className="mx-1.5 text-slate-400">vs</span>
                <span className="font-bold">{formatMxn(result.zone_avg_price_per_m2)}/m²</span>
                <span className="text-slate-400 ml-1">promedio zona</span>
              </span>
            </motion.div>
          </div>

          {/* Right — stat cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 lg:w-[230px]">
            {stats.map((s, i) => (
              <div
                key={i}
                className="px-4 py-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name={s.icon} className={`text-sm ${toneClass(s.tone)}`} />
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                </div>
                <p className={`text-xl font-black leading-none mb-1 ${toneClass(s.tone)}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Report body — incluye ScoreSlider con score + barra */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.4 }}
      >
        <ValuationReport
          result={result}
          narrative={narrative}
          property={property}
          showScoreSlider={true}
        />
      </motion.div>
    </div>
  )
}
