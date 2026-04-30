"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, animate } from "motion/react"
import { Icon } from "@/components/icon"
import { ZoneProfileCard } from "@/components/brujula/zone-profile-card"
import { PricePositionChart } from "@/components/brujula/price-position-chart"
import { AreaByTypeChart } from "@/components/zone/area-by-type-chart"
import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"

// ── Verdict config ──
const VERDICT_CONFIG: Record<ValuationVerdict, {
  label: string
  short: string
  text: string
  heroBg: string
  glow: string
  glow2: string
  chip: string
  scoreColor: string
  ring: string
}> = {
  muy_barata: {
    label: "Muy barato", short: "Excelente compra",
    text: "text-emerald-700 dark:text-emerald-400",
    heroBg: "from-emerald-200 via-emerald-50 to-white dark:from-emerald-950/60 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-emerald-500/45 dark:bg-emerald-500/25",
    glow2: "bg-emerald-400/30 dark:bg-emerald-400/18",
    chip: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
    scoreColor: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  barata: {
    label: "Barato", short: "Buena compra",
    text: "text-green-700 dark:text-green-400",
    heroBg: "from-green-200 via-green-50 to-white dark:from-green-950/60 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-green-500/45 dark:bg-green-500/25",
    glow2: "bg-green-400/30 dark:bg-green-400/18",
    chip: "bg-green-200 text-green-800 dark:bg-green-900/60 dark:text-green-300",
    scoreColor: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/30",
  },
  precio_justo: {
    label: "Precio justo", short: "Precio normal",
    text: "text-amber-700 dark:text-amber-400",
    heroBg: "from-amber-200 via-amber-50 to-white dark:from-amber-950/50 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-amber-500/45 dark:bg-amber-500/25",
    glow2: "bg-amber-400/30 dark:bg-amber-400/18",
    chip: "bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    scoreColor: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  cara: {
    label: "Caro", short: "Estás pagando de más",
    text: "text-orange-700 dark:text-orange-400",
    heroBg: "from-orange-200 via-orange-50 to-white dark:from-orange-950/50 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-orange-500/45 dark:bg-orange-500/25",
    glow2: "bg-orange-400/30 dark:bg-orange-400/18",
    chip: "bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300",
    scoreColor: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/30",
  },
  muy_cara: {
    label: "Muy caro", short: "Negocia o no compres",
    text: "text-red-700 dark:text-red-400",
    heroBg: "from-red-200 via-red-50 to-white dark:from-red-950/50 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-red-500/45 dark:bg-red-500/25",
    glow2: "bg-red-400/30 dark:bg-red-400/18",
    chip: "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300",
    scoreColor: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/30",
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

function formatMxnSigned(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(1)}M` : abs >= 1_000 ? `$${(abs / 1_000).toFixed(0)}K` : `$${abs.toFixed(0)}`
  return n >= 0 ? `+${formatted}` : `−${formatted}`
}

// Versión en palabras simples ("1.2 millones de pesos")
function formatPlainMxn(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m.toFixed(m >= 10 ? 0 : 1)} ${m === 1 ? "millón" : "millones"} de pesos`
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000).toLocaleString("es-MX")} mil pesos`
  }
  return `$${Math.round(n).toLocaleString("es-MX")}`
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
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
}

// ── Helpers tono ──
type Tone = "good" | "warn" | "danger" | "neutral"
function toneText(t: Tone) {
  return t === "good" ? "text-emerald-600 dark:text-emerald-400"
    : t === "warn" ? "text-amber-600 dark:text-amber-400"
    : t === "danger" ? "text-red-600 dark:text-red-400"
    : "text-slate-700 dark:text-slate-200"
}
function toneBar(t: Tone) {
  return t === "good" ? "bg-emerald-500"
    : t === "warn" ? "bg-amber-400"
    : t === "danger" ? "bg-red-500"
    : "bg-slate-400"
}
function toneBg(t: Tone) {
  return t === "good" ? "bg-emerald-50 dark:bg-emerald-950/30"
    : t === "warn" ? "bg-amber-50 dark:bg-amber-950/30"
    : t === "danger" ? "bg-red-50 dark:bg-red-950/30"
    : "bg-slate-50 dark:bg-slate-900/40"
}
function toneShadow(t: Tone) {
  return t === "good" ? "hover:shadow-emerald-500/15"
    : t === "warn" ? "hover:shadow-amber-500/15"
    : t === "danger" ? "hover:shadow-red-500/15"
    : "hover:shadow-slate-500/10"
}

// ── Animated counter (cinematográfico) ──
function AnimatedNumber({ value, duration = 1.8, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, duration])

  return <span className={className}>{display}</span>
}

// ── Tooltip simple ──
function InfoTooltip({ content }: { content: string }) {
  return (
    <span className="relative inline-flex items-center group/tip">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black leading-none cursor-help hover:bg-slate-800 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors select-none">
        i
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-medium leading-relaxed rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 w-60 normal-case tracking-normal">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
      </span>
    </span>
  )
}

// ── Section Eyebrow numerada ──
function SectionEyebrow({ num, label, accentColor }: { num: string; label: string; accentColor: string }) {
  return (
    <motion.div variants={fadeUp} className="flex items-baseline gap-3 mb-4">
      <span className={`font-display text-2xl font-bold leading-none ${accentColor}`}>{num}</span>
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em]">{label}</span>
    </motion.div>
  )
}

// ── Gauge semi-circular ──
function Gauge({ value, max, tone, suffix = "" }: { value: number; max: number; tone: Tone; suffix?: string }) {
  const pct = Math.min(1, Math.max(0, value / max))
  const radius = 70
  const circumference = Math.PI * radius
  const dashOffset = circumference * (1 - pct)
  const colorClass = tone === "good" ? "stroke-emerald-500"
    : tone === "warn" ? "stroke-amber-400"
    : tone === "danger" ? "stroke-red-500"
    : "stroke-slate-400"

  return (
    <div className="relative w-full max-w-[180px] mx-auto" style={{ aspectRatio: "2 / 1.1" }}>
      <svg viewBox="0 0 180 100" className="w-full h-full overflow-visible">
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d="M 20 90 A 70 70 0 0 1 160 90"
          className={colorClass}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex items-end justify-center pb-1">
        <span className={`font-display text-3xl font-black leading-none ${toneText(tone)}`}>
          {value.toFixed(value < 10 ? 1 : 0)}{suffix}
        </span>
      </div>
    </div>
  )
}

// ── Barra score 0-100 ──
function ScoreBar({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const v = Math.max(0, Math.min(100, value))
  const tone: Tone = inverse
    ? (v >= 70 ? "good" : v >= 40 ? "warn" : "danger")
    : (v < 40 ? "good" : v < 65 ? "warn" : "danger")

  return (
    <div>
      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 ${toneBar(tone)} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ width: `${v}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.4 }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  )
}

// ── Visual: Sobreprecio (KPI hero, dos torres comparativas) ──
function OverpaidVisual({ priceM2, zoneM2, tone }: { priceM2: number; zoneM2: number; tone: Tone }) {
  const max = Math.max(priceM2, zoneM2) * 1.1
  const tuPct = (priceM2 / max) * 100
  const zonaPct = (zoneM2 / max) * 100
  const isHigher = priceM2 > zoneM2

  return (
    <div className="w-full h-full flex items-end justify-center gap-6 px-4 pt-2">
      {/* Tu torre */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
        <span className={`font-display text-base font-black leading-none ${toneText(tone)}`}>
          {formatMxn(priceM2)}
        </span>
        <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden relative flex items-end">
          <motion.div
            className={`w-full ${toneBar(tone)} rounded-t-lg shadow-lg`}
            initial={{ height: "0%" }}
            animate={{ height: `${tuPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.5 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Icon name="person" className="text-xs text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tú</span>
        </div>
      </div>

      {/* Diferencia indicator */}
      <div className="flex flex-col items-center gap-1 pb-12">
        <Icon
          name={isHigher ? "arrow_upward" : "arrow_downward"}
          className={`text-2xl ${toneText(tone)}`}
        />
      </div>

      {/* Zona torre */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
        <span className="font-display text-base font-black leading-none text-slate-700 dark:text-slate-300">
          {formatMxn(zoneM2)}
        </span>
        <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden relative flex items-end">
          <motion.div
            className="w-full bg-slate-400 dark:bg-slate-600 rounded-t-lg"
            initial={{ height: "0%" }}
            animate={{ height: `${zonaPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.65 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Icon name="location_city" className="text-xs text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zona</span>
        </div>
      </div>
    </div>
  )
}

// ── KPI Card hero (Sobreprecio) ──
function KpiHeroCard({
  label, question, bigValue, subValue, tone, visual, tooltip, plainExplain,
}: {
  label: string
  question: string
  bigValue: string
  subValue: string
  tone: Tone
  visual: React.ReactNode
  tooltip?: string
  plainExplain?: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`bg-surface rounded-2xl p-6 md:p-7 card-shadow border border-slate-400/35 dark:border-slate-500/30 hover:shadow-xl ${toneShadow(tone)} transition-shadow`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start h-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneBg(tone)}`}>
              <Icon name="account_balance_wallet" className={`text-lg ${toneText(tone)}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-[0.18em]">{label}</p>
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
          </div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1 leading-tight">{question}</p>
          <p className={`font-display text-[3.5rem] md:text-[4.5rem] font-black leading-[0.9] mt-3 ${toneText(tone)}`}>
            {bigValue}
          </p>
          {plainExplain && (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1.5">{plainExplain}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{subValue}</p>
        </div>

        <div className="md:w-[260px] flex items-center justify-center">
          {visual}
        </div>
      </div>
    </motion.div>
  )
}

// ── KPI Card compacto ──
function KpiCard({
  icon, label, bigValue, subValue, tone, visual, question, tooltip,
}: {
  icon: string
  label: string
  bigValue: string
  subValue: string
  tone: Tone
  visual: React.ReactNode
  question: string
  tooltip?: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`bg-surface rounded-2xl p-5 card-shadow border border-slate-400/35 dark:border-slate-500/30 hover:shadow-xl ${toneShadow(tone)} transition-shadow flex flex-col`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneBg(tone)}`}>
          <Icon name={icon} className={`text-base ${toneText(tone)}`} />
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{label}</p>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
      </div>

      <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-3">{question}</p>

      <div className="flex-1 flex items-center justify-center min-h-[90px]">
        {visual}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className={`font-display text-[1.75rem] font-black leading-tight ${toneText(tone)}`}>{bigValue}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subValue}</p>
      </div>
    </motion.div>
  )
}

export function ValuationDetailClient({ result, narrative, property }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]
  const pinPos = Math.max(2, Math.min(98, result.score))
  const overpaidMxn = (result.price_per_m2 - result.zone_avg_price_per_m2) * property.area_m2

  // Tones
  const priceTone: Tone = result.price_premium_pct > 10 ? "danger" : result.price_premium_pct < -5 ? "good" : "warn"
  const capTone: Tone = result.cap_rate == null ? "neutral" : result.cap_rate >= 7 ? "good" : result.cap_rate >= 5 ? "warn" : "danger"
  const riskTone: Tone = result.risk_score < 40 ? "good" : result.risk_score < 65 ? "warn" : "danger"
  const liqTone: Tone = result.liquidity_score >= 70 ? "good" : result.liquidity_score >= 40 ? "warn" : "danger"

  const propertyChips = [
    { icon: "payments", label: formatMxn(property.price_mxn) },
    { icon: "square_foot", label: `${property.area_m2} m²` },
    ...(property.bedrooms != null ? [{ icon: "bed", label: `${property.bedrooms} rec.` }] : []),
    ...(property.bathrooms != null ? [{ icon: "shower", label: `${property.bathrooms} baños` }] : []),
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-10">
      {/* ── Back nav ── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/brujula"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Icon name="arrow_back" className="text-base" />
          Brújula
        </Link>
      </motion.div>

      {/* ══════════════════════════════════ */}
      {/* ── 1. HERO CINEMATOGRÁFICO ── */}
      {/* ══════════════════════════════════ */}
      <motion.div variants={fadeUp}>
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.heroBg} p-6 md:p-12 border border-slate-400/35 dark:border-slate-500/30`}>
          {/* Animated glow blobs */}
          <motion.div
            className={`absolute -top-20 -right-20 w-96 h-96 ${cfg.glow} rounded-full blur-3xl pointer-events-none`}
            animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`absolute -bottom-16 -left-12 w-72 h-72 ${cfg.glow2} rounded-full blur-3xl pointer-events-none`}
            animate={{ scale: [1, 1.15, 1], x: [0, -15, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="relative">
            {/* Eyebrow numerado */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className={`font-display text-2xl font-bold leading-none ${cfg.scoreColor}`}>01</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em]">
                Reporte de valuación · {result.zone_name}
              </span>
            </div>

            {/* Layout asimétrico: número GIGANTE izquierda, propiedad derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-14 items-end mb-12">
              {/* Score block */}
              <div className="flex items-end gap-5">
                <AnimatedNumber
                  value={result.score}
                  className={`font-display text-[8rem] sm:text-[10rem] lg:text-[13rem] font-black leading-[0.82] tracking-tight ${cfg.scoreColor}`}
                />
                <div className="flex flex-col gap-2 pb-3 lg:pb-6">
                  <span className={`inline-flex w-fit items-center px-3 py-1.5 rounded-xl text-sm font-bold ${cfg.chip}`}>
                    {cfg.label}
                  </span>
                  <p className={`font-display text-lg font-extrabold ${cfg.text} leading-tight`}>
                    {cfg.short}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    de 100 · percentil {result.price_percentile}
                  </p>
                </div>
              </div>

              {/* Property summary */}
              <div className="lg:border-l lg:border-slate-300/40 dark:lg:border-slate-700/40 lg:pl-12 lg:pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Propiedad analizada</p>
                <h1 className="font-display text-2xl md:text-[28px] font-extrabold text-slate-900 dark:text-slate-100 mb-3 leading-tight">
                  {TYPE_LABELS[property.property_type]} en {property.listing_type}
                  <span className={`block ${cfg.scoreColor} mt-0.5`}>· {result.zone_name}</span>
                </h1>
                <div className="flex flex-wrap gap-1.5">
                  {propertyChips.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/40">
                      <Icon name={c.icon} className="text-xs text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score bar gruesa con checkpoints + badge */}
            <div>
              <div className="flex justify-between mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                {[0, 20, 40, 60, 80, 100].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              <div className="relative">
                <div className="flex h-4 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)]">
                  {SCORE_ZONES.map((z, i) => (
                    <div key={i} className={`${z.color} flex-1 opacity-85`} />
                  ))}
                </div>
                <motion.div
                  className="absolute top-0 -translate-x-1/2"
                  initial={{ left: "0%" }}
                  animate={{ left: `${pinPos}%` }}
                  transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.5 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.3 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md text-[11px] font-black shadow-lg whitespace-nowrap font-display"
                  >
                    {result.score}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
                  </motion.div>
                  <div className="w-1 h-4 bg-slate-900 dark:bg-white rounded-full" />
                  <div className="w-5 h-5 bg-white dark:bg-slate-900 rounded-full -mt-1 -ml-2 border-[3px] border-slate-900 dark:border-white shadow-xl" />
                </motion.div>
              </div>

              <div className="flex text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                {SCORE_ZONES.map((z, i) => (
                  <span key={i} className="flex-1 text-center">{z.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════ */}
      {/* ── 2. ¿VALE LA PENA? — KPI Hero + 3 ── */}
      {/* ══════════════════════════════════ */}
      <div>
        <SectionEyebrow num="02" label="¿Vale la pena?" accentColor={cfg.scoreColor} />

        {/* Sobreprecio = KPI hero (col-span-2 lg) + 3 secundarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Sobreprecio HERO */}
          <div className="md:col-span-2 lg:col-span-2">
            <KpiHeroCard
              label="Sobreprecio"
              question={overpaidMxn > 0 ? "¿Cuánto pagas de más?" : "¿Cuánto te ahorras?"}
              bigValue={formatMxnSigned(overpaidMxn)}
              plainExplain={`${formatPlainMxn(Math.abs(overpaidMxn))} ${overpaidMxn >= 0 ? "más" : "menos"} que el promedio`}
              subValue={`${result.price_premium_pct > 0 ? "+" : ""}${result.price_premium_pct.toFixed(1)}% vs promedio de zona`}
              tone={priceTone}
              tooltip="(Tu precio/m² − promedio de la zona) × tus m². Negativo = ahorras."
              visual={<OverpaidVisual priceM2={result.price_per_m2} zoneM2={result.zone_avg_price_per_m2} tone={priceTone} />}
            />
          </div>

          {/* Cap Rate */}
          <KpiCard
            icon="savings"
            label="Rentabilidad"
            question="¿Buena para rentar?"
            bigValue={result.cap_rate != null ? `${result.cap_rate.toFixed(1)}%` : "—"}
            subValue={
              result.cap_rate == null
                ? "Sin datos de renta"
                : result.cap_rate >= 7 ? "Cap rate atractivo"
                : result.cap_rate >= 5 ? "Cap rate moderado" : "Cap rate bajo"
            }
            tone={capTone}
            tooltip="Renta anual estimada ÷ precio de la propiedad. Más de 7% atractivo, 5-7% moderado, menos de 5% bajo. Usa rentas promedio de la zona."
            visual={<Gauge value={result.cap_rate ?? 0} max={12} tone={capTone} suffix="%" />}
          />

          {/* Riesgo */}
          <KpiCard
            icon="shield"
            label="Riesgo zona"
            question="¿Qué tan estable?"
            bigValue={`${result.risk_score}/100`}
            subValue={result.risk_label || (result.risk_score < 40 ? "Bajo riesgo" : result.risk_score < 65 ? "Riesgo medio" : "Alto riesgo")}
            tone={riskTone}
            tooltip="Mezcla volatilidad de precios, demanda y nivel socioeconómico. 0 = estable, 100 = alto riesgo."
            visual={<div className="w-full px-3"><ScoreBar value={result.risk_score} /></div>}
          />

          {/* Liquidez */}
          <KpiCard
            icon="swap_horiz"
            label="Liquidez"
            question="¿Fácil revender?"
            bigValue={`${result.liquidity_score}/100`}
            subValue={result.liquidity_score >= 70 ? "Reventa rápida" : result.liquidity_score >= 40 ? "Reventa moderada" : "Reventa lenta"}
            tone={liqTone}
            tooltip="Tiempo promedio en mercado y volumen de ventas en la zona. 100 = reventa rápida, 0 = lenta."
            visual={<div className="w-full px-3"><ScoreBar value={result.liquidity_score} inverse /></div>}
          />
        </div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── 3. NARRATIVA + VS ZONA ── */}
      {/* ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Narrativa AI */}
        {narrative && (
          <motion.div variants={fadeUp}>
            <div className="relative h-full bg-surface rounded-2xl p-6 md:p-7 card-shadow border border-slate-400/35 dark:border-slate-500/30">
              <SectionEyebrow num="03" label="Análisis IA" accentColor="text-blue-600 dark:text-blue-400" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" className="text-lg text-blue-600 dark:text-blue-400" />
                </div>
                <p className="flex-1 text-sm md:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {renderNarrative(narrative)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tu propiedad vs zona */}
        <motion.div variants={fadeUp}>
          <div className="h-full bg-surface rounded-2xl p-6 md:p-7 card-shadow border border-slate-400/35 dark:border-slate-500/30">
            <SectionEyebrow num="04" label="Tu propiedad vs zona" accentColor={cfg.scoreColor} />

            <div className="space-y-5">
              <CompareRow
                label="Precio por m²"
                tu={result.price_per_m2}
                zona={result.zone_avg_price_per_m2}
                format={formatMxn}
                diffPct={result.price_premium_pct}
                diffLabelGood="Bajo el promedio"
                diffLabelBad="Sobre el promedio"
              />
              <CompareRow
                label="Precio total"
                tu={property.price_mxn}
                zona={result.zone_avg_ticket}
                format={formatMxn}
                diffPct={result.ticket_premium_pct}
                diffLabelGood="Más barata"
                diffLabelBad="Más cara"
              />
              <CompareRow
                label="Superficie"
                tu={property.area_m2}
                zona={result.zone_avg_area}
                format={(n) => `${Math.round(n)} m²`}
                diffPct={result.area_vs_zone_avg_pct}
                diffLabelGood="Más grande"
                diffLabelBad="Más chica"
                biggerIsBetter
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── 5. PERFIL DE ZONA ── */}
      {/* ══════════════════════════════════ */}
      <div>
        <SectionEyebrow num="05" label="Perfil de zona" accentColor={cfg.scoreColor} />
        <motion.div variants={fadeUp}>
          <ZoneProfileCard result={result} />
        </motion.div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── 6. MERCADO ── */}
      {/* ══════════════════════════════════ */}
      <div>
        <SectionEyebrow num="06" label="Mercado" accentColor={cfg.scoreColor} />
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PricePositionChart distribution={result.zone_price_distribution} />
          {result.area_by_type?.length > 0 && (
            <AreaByTypeChart data={result.area_by_type} zoneName={result.zone_name} />
          )}
        </motion.div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── 7. CTAs ── */}
      {/* ══════════════════════════════════ */}
      <div>
        <SectionEyebrow num="07" label="Acciones" accentColor={cfg.scoreColor} />
        <motion.div variants={fadeUp}>
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-400/35 dark:border-slate-500/30 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`/zona/${result.zone_slug}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Icon name="location_on" className="text-sm" />
              Ver análisis de {result.zone_name}
            </a>
            <a
              href="/comparar"
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Icon name="compare_arrows" className="text-sm" />
              Comparar zonas
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Compare row con barras paralelas ──
function CompareRow({
  label, tu, zona, format, diffPct, diffLabelGood, diffLabelBad, biggerIsBetter = false,
}: {
  label: string
  tu: number
  zona: number
  format: (n: number) => string
  diffPct: number
  diffLabelGood: string
  diffLabelBad: string
  biggerIsBetter?: boolean
}) {
  const max = Math.max(tu, zona) * 1.15
  const tuPct = (tu / max) * 100
  const zonaPct = (zona / max) * 100

  const isGood = biggerIsBetter ? diffPct > 0 : diffPct < 0
  const tone: Tone = Math.abs(diffPct) < 5 ? "neutral" : isGood ? "good" : "danger"

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
        <span className={`text-sm font-extrabold ${toneText(tone)}`}>
          {diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%
          <span className="text-[11px] text-slate-400 font-medium ml-1.5">
            {Math.abs(diffPct) < 5 ? "casi igual" : isGood ? diffLabelGood : diffLabelBad}
          </span>
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider w-12 flex-shrink-0">Tú</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-md flex items-center justify-end pr-2"
              initial={{ width: "0%" }}
              animate={{ width: `${tuPct}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.3 }}
            >
              <span className="text-[10px] font-black text-white">{format(tu)}</span>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12 flex-shrink-0">Zona</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-slate-400 dark:bg-slate-600 rounded-md flex items-center justify-end pr-2"
              initial={{ width: "0%" }}
              animate={{ width: `${zonaPct}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.4 }}
            >
              <span className="text-[10px] font-black text-white">{format(zona)}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Render markdown light **bold** ──
function renderNarrative(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-extrabold text-slate-900 dark:text-slate-50">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
