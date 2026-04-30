"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import { ZoneProfileCard } from "@/components/brujula/zone-profile-card"
import { PricePositionChart } from "@/components/brujula/price-position-chart"
import { AreaByTypeChart } from "@/components/zone/area-by-type-chart"
import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"

// ── Verdict config ──
const VERDICT_CONFIG: Record<ValuationVerdict, {
  label: string
  short: string
  accent: string
  text: string
  heroBg: string
  glow: string
  chip: string
  scoreColor: string
}> = {
  muy_barata: {
    label: "Muy barato", short: "Excelente compra",
    accent: "emerald",
    text: "text-emerald-600 dark:text-emerald-400",
    heroBg: "from-emerald-50/80 via-white to-white dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-emerald-400/20 dark:bg-emerald-500/15",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    scoreColor: "text-emerald-500 dark:text-emerald-400",
  },
  barata: {
    label: "Barato", short: "Buena compra",
    accent: "green",
    text: "text-green-600 dark:text-green-400",
    heroBg: "from-green-50/80 via-white to-white dark:from-green-950/40 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-green-400/20 dark:bg-green-500/15",
    chip: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    scoreColor: "text-green-500 dark:text-green-400",
  },
  precio_justo: {
    label: "Precio justo", short: "Precio normal",
    accent: "amber",
    text: "text-amber-600 dark:text-amber-400",
    heroBg: "from-amber-50/80 via-white to-white dark:from-amber-950/30 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-amber-400/20 dark:bg-amber-500/15",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    scoreColor: "text-amber-500 dark:text-amber-400",
  },
  cara: {
    label: "Caro", short: "Estás pagando de más",
    accent: "orange",
    text: "text-orange-600 dark:text-orange-400",
    heroBg: "from-orange-50/80 via-white to-white dark:from-orange-950/30 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-orange-400/20 dark:bg-orange-500/15",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    scoreColor: "text-orange-500 dark:text-orange-400",
  },
  muy_cara: {
    label: "Muy caro", short: "Negocia o no compres",
    accent: "red",
    text: "text-red-600 dark:text-red-400",
    heroBg: "from-red-50/80 via-white to-white dark:from-red-950/30 dark:via-slate-950 dark:to-slate-950",
    glow: "bg-red-400/20 dark:bg-red-500/15",
    chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    scoreColor: "text-red-500 dark:text-red-400",
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
        {/* Track */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        {/* Value */}
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
      {/* Value text overlay */}
      <div className="absolute inset-x-0 bottom-1 flex items-end justify-center pb-1">
        <span className={`text-3xl font-black leading-none ${toneText(tone)}`}>
          {value.toFixed(value < 10 ? 1 : 0)}{suffix}
        </span>
      </div>
    </div>
  )
}

// ── Barra score 0-100 con segmentos ──
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

// ── Barra de Sobreprecio (tu propiedad vs rango zona) ──
function OverpaidBar({ premiumPct }: { premiumPct: number }) {
  // Mapeo del premium a posición visual: clamp a -50%/+100% para visualización
  const min = -50, max = 100
  const clamped = Math.max(min, Math.min(max, premiumPct))
  const pos = ((clamped - min) / (max - min)) * 100
  const zonaPos = ((0 - min) / (max - min)) * 100 // posición de "zona promedio" = 0%

  return (
    <div className="w-full">
      <div className="relative h-12">
        {/* Track con gradiente */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500" />

        {/* Marker zona */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${zonaPos}%` }}>
          <div className="w-0.5 h-5 bg-slate-700 dark:bg-slate-200" />
          <span className="absolute top-full mt-1 -translate-x-1/2 left-1/2 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Zona</span>
        </div>

        {/* Marker tu propiedad */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          initial={{ left: `${zonaPos}%`, opacity: 0 }}
          animate={{ left: `${pos}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.5 }}
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-400 border-4 border-white dark:border-slate-900 shadow-lg" />
        </motion.div>
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span className="text-emerald-600 dark:text-emerald-400">Más barato</span>
        <span className="text-red-600 dark:text-red-400">Más caro</span>
      </div>
    </div>
  )
}

// ── KPI Card ──
function KpiCard({
  icon,
  label,
  bigValue,
  subValue,
  tone,
  visual,
  question,
}: {
  icon: string
  label: string
  bigValue: string
  subValue: string
  tone: Tone
  visual: React.ReactNode
  question: string
}) {
  return (
    <motion.div variants={fadeUp} className="bg-surface rounded-2xl p-6 card-shadow border border-slate-400/35 dark:border-slate-500/30 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneBg(tone)}`}>
            <Icon name={icon} className={`text-base ${toneText(tone)}`} />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{label}</p>
        </div>
      </div>

      <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-3">{question}</p>

      <div className="flex-1 flex items-center justify-center min-h-[100px]">
        {visual}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className={`text-2xl font-black leading-tight ${toneText(tone)}`}>{bigValue}</p>
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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
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

      {/* ── 1. Hero / Score Block ── */}
      <motion.div variants={fadeUp}>
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.heroBg} p-6 md:p-10 border border-slate-100 dark:border-slate-800/50`}>
          <div className={`absolute -top-16 -right-16 w-72 h-72 ${cfg.glow} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-12 -left-12 w-56 h-56 ${cfg.glow} rounded-full blur-3xl pointer-events-none opacity-60`} />

          <div className="relative">
            {/* Eyebrow */}
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
              Reporte de valuación · {result.zone_name}
            </p>

            {/* Layout principal del score */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-center mb-8">
              {/* Score number + verdict chip */}
              <div className="flex items-center gap-5">
                <span className={`text-[7rem] md:text-[9rem] font-black leading-none ${cfg.scoreColor}`}>
                  {result.score}
                </span>
                <div className="flex flex-col gap-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold ${cfg.chip} w-fit`}>
                    {cfg.label}
                  </span>
                  <p className={`text-base font-extrabold ${cfg.text}`}>{cfg.short}</p>
                  <p className="text-xs text-slate-400 font-medium">de 100 · percentil {result.price_percentile}</p>
                </div>
              </div>

              {/* Property summary */}
              <div className="lg:border-l lg:border-slate-200 dark:lg:border-slate-700/50 lg:pl-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Propiedad</p>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-3 leading-tight">
                  {TYPE_LABELS[property.property_type]} en {property.listing_type} · {result.zone_name}
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

            {/* Score bar — la barra del slider, integrada en hero */}
            <div>
              {/* Checkpoints arriba */}
              <div className="flex justify-between mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                {[0, 20, 40, 60, 80, 100].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              <div className="relative">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {SCORE_ZONES.map((z, i) => (
                    <div key={i} className={`${z.color} flex-1 opacity-80`} />
                  ))}
                </div>
                <motion.div
                  className="absolute top-0 -translate-x-1/2"
                  initial={{ left: "0%" }}
                  animate={{ left: `${pinPos}%` }}
                  transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.5 }}
                >
                  {/* Badge con score de la propiedad */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md text-[11px] font-black shadow-md whitespace-nowrap"
                  >
                    {result.score}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
                  </motion.div>
                  {/* Pin */}
                  <div className="w-1 h-3 bg-slate-900 dark:bg-white rounded-full" />
                  <div className="w-4 h-4 bg-white dark:bg-slate-900 rounded-full -mt-1 -ml-1.5 border-[3px] border-slate-900 dark:border-white shadow-lg" />
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

      {/* ── 2. ¿Vale la pena? — KPI board ── */}
      <div>
        <motion.div variants={fadeUp} className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">¿Vale la pena?</h2>
          <p className="text-xs text-slate-400 font-medium">4 indicadores clave</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sobreprecio */}
          <KpiCard
            icon={result.price_premium_pct > 0 ? "trending_up" : "trending_down"}
            label="Sobreprecio"
            question="¿Cuánto pagas de más vs zona?"
            bigValue={formatMxnSigned(overpaidMxn)}
            subValue={`${result.price_premium_pct > 0 ? "+" : ""}${result.price_premium_pct.toFixed(1)}% vs zona`}
            tone={priceTone}
            visual={<OverpaidBar premiumPct={result.price_premium_pct} />}
          />

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
            visual={<Gauge value={result.cap_rate ?? 0} max={12} tone={capTone} suffix="%" />}
          />

          {/* Riesgo */}
          <KpiCard
            icon="shield"
            label="Riesgo zona"
            question="¿Qué tan estable es la zona?"
            bigValue={`${result.risk_score}/100`}
            subValue={result.risk_label || (result.risk_score < 40 ? "Bajo riesgo" : result.risk_score < 65 ? "Riesgo medio" : "Alto riesgo")}
            tone={riskTone}
            visual={
              <div className="w-full px-3">
                <ScoreBar value={result.risk_score} />
              </div>
            }
          />

          {/* Liquidez */}
          <KpiCard
            icon="swap_horiz"
            label="Liquidez"
            question="¿Fácil de revender?"
            bigValue={`${result.liquidity_score}/100`}
            subValue={result.liquidity_score >= 70 ? "Reventa rápida" : result.liquidity_score >= 40 ? "Reventa moderada" : "Reventa lenta"}
            tone={liqTone}
            visual={
              <div className="w-full px-3">
                <ScoreBar value={result.liquidity_score} inverse />
              </div>
            }
          />
        </div>
      </div>

      {/* ── 3. Narrativa AI + Tu propiedad vs zona — 50/50 desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Narrativa AI */}
        {narrative && (
          <motion.div variants={fadeUp}>
            <div className="relative h-full bg-surface rounded-2xl p-6 md:p-7 card-shadow border border-slate-400/35 dark:border-slate-500/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" className="text-lg text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Análisis IA</p>
                  <p className="text-sm md:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {renderNarrative(narrative)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tu propiedad vs zona */}
        <motion.div variants={fadeUp}>
          <div className="h-full bg-surface rounded-2xl p-6 md:p-7 card-shadow border border-slate-400/35 dark:border-slate-500/30">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Tu propiedad vs zona</h2>
              <p className="text-xs text-slate-400 font-medium">{result.zone_name}</p>
            </div>

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

      {/* ── 5. Perfil de zona ── */}
      <motion.div variants={fadeUp}>
        <ZoneProfileCard result={result} />
      </motion.div>

      {/* ── 6. Charts ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PricePositionChart distribution={result.zone_price_distribution} />
        {result.area_by_type?.length > 0 && (
          <AreaByTypeChart data={result.area_by_type} zoneName={result.zone_name} />
        )}
      </motion.div>

      {/* ── 7. CTAs ── */}
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

  // Si bigger is better, diff>0 is good. Si no, diff>0 is bad.
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
