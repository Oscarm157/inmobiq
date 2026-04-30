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
  glow1: string
  glow2: string
  chip: string
  statBg: string
}> = {
  muy_barata: {
    label: "Muy barato",
    scoreColor: "text-emerald-500 dark:text-emerald-400",
    heroBg: "from-emerald-950 via-slate-900 to-slate-950",
    glow1: "bg-emerald-500/20",
    glow2: "bg-emerald-400/10",
    chip: "bg-emerald-400/20 text-emerald-300 border border-emerald-500/30",
    statBg: "bg-white/[0.06] border-white/[0.08]",
  },
  barata: {
    label: "Barato",
    scoreColor: "text-green-400",
    heroBg: "from-green-950 via-slate-900 to-slate-950",
    glow1: "bg-green-500/20",
    glow2: "bg-green-400/10",
    chip: "bg-green-400/20 text-green-300 border border-green-500/30",
    statBg: "bg-white/[0.06] border-white/[0.08]",
  },
  precio_justo: {
    label: "Precio justo",
    scoreColor: "text-amber-400",
    heroBg: "from-amber-950 via-slate-900 to-slate-950",
    glow1: "bg-amber-500/20",
    glow2: "bg-amber-400/10",
    chip: "bg-amber-400/20 text-amber-300 border border-amber-500/30",
    statBg: "bg-white/[0.06] border-white/[0.08]",
  },
  cara: {
    label: "Caro",
    scoreColor: "text-orange-400",
    heroBg: "from-orange-950 via-slate-900 to-slate-950",
    glow1: "bg-orange-500/20",
    glow2: "bg-orange-400/10",
    chip: "bg-orange-400/20 text-orange-300 border border-orange-500/30",
    statBg: "bg-white/[0.06] border-white/[0.08]",
  },
  muy_cara: {
    label: "Muy caro",
    scoreColor: "text-red-400",
    heroBg: "from-red-950 via-slate-900 to-slate-950",
    glow1: "bg-red-500/20",
    glow2: "bg-red-400/10",
    chip: "bg-red-400/20 text-red-300 border border-red-500/30",
    statBg: "bg-white/[0.06] border-white/[0.08]",
  },
}

const SCORE_ZONES = [
  { color: "bg-red-500", label: "Muy cara" },
  { color: "bg-orange-400", label: "Cara" },
  { color: "bg-amber-400", label: "Justo" },
  { color: "bg-green-400", label: "Barata" },
  { color: "bg-emerald-500", label: "Muy barata" },
]

const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa", departamento: "Depto", terreno: "Terreno", local: "Local", oficina: "Oficina",
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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
}

export function ValuationDetailClient({ result, narrative, property }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]
  const pinPos = Math.max(2, Math.min(98, result.score))
  const premiumPct = result.price_premium_pct

  const stats = [
    {
      label: "Precio/m²",
      value: formatMxn(result.price_per_m2),
      sub: `zona: ${formatMxn(result.zone_avg_price_per_m2)}`,
      highlight: premiumPct > 10 ? "text-red-400" : premiumPct < -5 ? "text-emerald-400" : "text-white",
    },
    {
      label: "Diferencia",
      value: `${premiumPct > 0 ? "+" : ""}${premiumPct.toFixed(1)}%`,
      sub: premiumPct > 0 ? "sobre el mercado" : "bajo el mercado",
      highlight: premiumPct > 10 ? "text-red-400" : premiumPct < -5 ? "text-emerald-400" : "text-amber-400",
    },
    {
      label: "Percentil",
      value: `${result.price_percentile}`,
      sub: `más caro que ${result.price_percentile}% de la zona`,
      highlight: "text-white",
    },
    ...(result.cap_rate != null ? [{
      label: "Cap Rate",
      value: `${result.cap_rate.toFixed(1)}%`,
      sub: result.cap_rate >= 7 ? "atractivo" : result.cap_rate >= 5 ? "moderado" : "bajo",
      highlight: result.cap_rate >= 7 ? "text-emerald-400" : result.cap_rate >= 5 ? "text-amber-400" : "text-red-400",
    }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/brujula"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-blue-500 transition-colors"
      >
        <Icon name="arrow_back" className="text-base" />
        Brújula
      </Link>

      {/* ── Hero ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.heroBg} p-8 md:p-10`}>
        {/* Glows */}
        <div className={`absolute -top-20 -left-20 w-80 h-80 ${cfg.glow1} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-10 -right-10 w-60 h-60 ${cfg.glow2} rounded-full blur-3xl pointer-events-none`} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative">
          {/* Eyebrow */}
          <motion.p variants={fadeUp} className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">
            Reporte de valuación · {result.zone_name}
          </motion.p>

          {/* Desktop: 2 columnas — score izquierda, stats derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            {/* Left: score + veredicto + bar + property */}
            <div>
              {/* Score + chip */}
              <motion.div variants={fadeUp} className="flex items-end gap-4 mb-4">
                <span className={`text-[6rem] font-black leading-none ${cfg.scoreColor}`}>
                  {result.score}
                </span>
                <div className="pb-3 flex flex-col gap-1.5">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold border ${cfg.chip}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-white/40 font-medium">de 100 puntos</span>
                </div>
              </motion.div>

              {/* Score bar */}
              <motion.div variants={fadeUp} className="mb-5">
                <div className="relative mb-1.5">
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    {SCORE_ZONES.map((z, i) => (
                      <div key={i} className={`${z.color} flex-1 opacity-70`} />
                    ))}
                  </div>
                  <motion.div
                    className="absolute top-0 -translate-x-1/2"
                    initial={{ left: "0%" }}
                    animate={{ left: `${pinPos}%` }}
                    transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.4 }}
                  >
                    <div className="w-1 h-2.5 bg-white rounded-full" />
                    <div className="w-3.5 h-3.5 bg-white rounded-full -mt-1 -ml-1.5 border-2 border-slate-900 shadow-lg" />
                  </motion.div>
                </div>
                <div className="flex text-[9px] font-bold uppercase tracking-wider text-white/30">
                  {SCORE_ZONES.map((z, i) => (
                    <span key={i} className="flex-1 text-center">{z.label}</span>
                  ))}
                </div>
              </motion.div>

              {/* Property title + chips */}
              <motion.div variants={fadeUp}>
                <p className="text-white font-bold text-lg mb-3">
                  {TYPE_LABELS[property.property_type]} en {property.listing_type}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: "payments", v: formatMxn(property.price_mxn) },
                    { icon: "square_foot", v: `${property.area_m2} m²` },
                    ...(property.bedrooms != null ? [{ icon: "bed", v: `${property.bedrooms}` }] : []),
                    ...(property.bathrooms != null ? [{ icon: "shower", v: `${property.bathrooms}` }] : []),
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.08]">
                      <Icon name={c.icon} className="text-sm text-white/50" />
                      <span className="text-sm font-bold text-white/90">{c.v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: stat cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:min-w-[180px]">
              {stats.map((s, i) => (
                <div key={i} className={`px-4 py-3 rounded-xl border ${cfg.statBg}`}>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-0.5">{s.label}</p>
                  <p className={`text-xl font-black leading-tight ${s.highlight}`}>{s.value}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Report body */}
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
