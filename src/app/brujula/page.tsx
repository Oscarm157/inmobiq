"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Icon } from "@/components/icon"
import { Breadcrumb } from "@/components/breadcrumb"
import { ScreenshotUploader } from "@/components/brujula/screenshot-uploader"
import { ManualForm, type ManualFormResult } from "@/components/brujula/manual-form"
import { ExtractionReview, type ReviewResult } from "@/components/brujula/extraction-review"
import { ValuationReport } from "@/components/brujula/valuation-report"
import { ValuationHistory } from "@/components/brujula/valuation-history"
import Link from "next/link"
import type { ExtractedPropertyData, ValuationResult, PropertyType, ListingType } from "@/types/database"

type Step = "input" | "review" | "result"
type InputMode = "screenshots" | "manual"

interface PropertyData {
  property_type: PropertyType
  listing_type: ListingType
  price_mxn: number
  area_m2: number
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  address: string | null
}

const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const heroItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
}
const featureCardVariant = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const FEATURES = [
  { icon: "speed", label: "Instantáneo", desc: "Resultado en segundos con datos reales del mercado", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-kpi-icon-green" },
  { icon: "compare_arrows", label: "vs Mercado", desc: "Comparación directa con precio/m² de la zona", color: "text-blue-600 dark:text-blue-400", bg: "bg-kpi-icon-blue" },
  { icon: "insights", label: "Narrativa AI", desc: "Posición en el mercado y análisis contextual", color: "text-violet-600 dark:text-violet-400", bg: "bg-kpi-icon-violet" },
] as const

export default function BrujulaPage() {
  const [step, setStep] = useState<Step>("input")
  const [mode, setMode] = useState<InputMode>("manual")

  // Screenshot flow
  const [valuationId, setValuationId] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedPropertyData | null>(null)

  // Result
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [narrative, setNarrative] = useState("")
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleExtracted = (vId: string, data: Record<string, unknown>) => {
    setValuationId(vId)
    setExtracted(data as unknown as ExtractedPropertyData)
    setStep("review")
  }

  const handleManualResult = (data: ManualFormResult) => {
    setValuationId(data.valuationId)
    setResult(data.result)
    setNarrative(data.narrative)
    setProperty(data.property)
    setStep("result")
  }

  const handleReviewResult = (data: ReviewResult) => {
    setValuationId(data.valuationId)
    setResult(data.result)
    setNarrative(data.narrative)
    setProperty(data.property)
    setStep("result")
  }

  const reset = () => {
    setStep("input")
    setValuationId(null)
    setExtracted(null)
    setResult(null)
    setNarrative("")
    setProperty(null)
  }

  return (
    <div className="space-y-10">
      <Breadcrumb items={[{ label: "Brújula" }]} />

      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-950 p-8 md:p-10 lg:p-12">
        {/* Atmospheric decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/[0.08] rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-12 w-72 h-72 bg-emerald-500/[0.06] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-violet-500/[0.04] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          {/* Compass rings — concentric, rotated for dynamism */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-white/[0.06] hidden lg:block" style={{ transform: "translateY(-50%) rotate(15deg)" }} />
          <div className="absolute top-1/2 right-14 -translate-y-1/2 w-[260px] h-[260px] rounded-full border border-dashed border-white/[0.04] hidden lg:block" style={{ transform: "translateY(-50%) rotate(-10deg)" }} />
          <div className="absolute top-1/2 right-20 -translate-y-1/2 w-[180px] h-[180px] rounded-full border border-white/[0.03] hidden lg:block" style={{ transform: "translateY(-50%) rotate(5deg)" }} />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="relative grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-center"
        >
          {/* Left — Title + Segmented Control */}
          <div>
            <motion.span
              variants={heroItem}
              className="inline-flex px-3 py-1.5 bg-white/[0.08] text-blue-300 text-[10px] font-bold rounded-full tracking-widest uppercase mb-5 backdrop-blur-sm border border-white/[0.06]"
            >
              <Icon name="explore" className="text-xs mr-1.5" />
              Brújula Inmobiliaria
            </motion.span>

            <motion.h2
              variants={heroItem}
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-white mb-3 leading-[1.1]"
            >
              ¿Está a buen
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                precio?
              </span>
            </motion.h2>

            <motion.p
              variants={heroItem}
              className="text-slate-300 font-medium max-w-md mb-8 leading-relaxed text-[15px]"
            >
              Ingresa los datos de una propiedad y compárala al instante con el mercado de su zona.
            </motion.p>

            {/* Segmented control */}
            <motion.div variants={heroItem} className="inline-flex bg-white/[0.06] backdrop-blur-sm rounded-xl p-1 gap-1 border border-white/[0.06]">
              <button
                onClick={() => setMode("manual")}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === "manual"
                    ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon name="edit" className="text-base" />
                Datos manuales
              </button>
              <button
                onClick={() => setMode("screenshots")}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === "screenshots"
                    ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon name="add_photo_alternate" className="text-base" />
                Screenshots
              </button>
            </motion.div>
          </div>

          {/* Right — Feature cards with stagger */}
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
            initial="hidden"
            animate="visible"
            className="hidden lg:flex flex-col gap-3"
          >
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.icon}
                variants={featureCardVariant}
                whileHover={{ x: -4, transition: { type: "spring", stiffness: 400, damping: 17 } }}
                className="flex items-center gap-3.5 bg-white/[0.05] backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/[0.06] cursor-default"
              >
                <div className={`w-10 h-10 rounded-lg ${feat.bg} flex items-center justify-center shrink-0`}>
                  <Icon name={feat.icon} className={`${feat.color} text-lg`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">{feat.label}</p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ─── Auth Modal ─── */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-surface rounded-2xl p-8 max-w-sm mx-4 card-shadow text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-surface-inset flex items-center justify-center mx-auto">
                <Icon name="explore" className="text-2xl text-primary" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground">
                Regístrate para usar Brújula
              </h3>
              <p className="text-sm text-muted-foreground">
                Crea tu cuenta gratis y obtén 3 valuaciones al mes. Compara cualquier propiedad contra el mercado de su zona.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <Icon name="person_add" className="text-base" />
                  Crear cuenta gratis
                </Link>
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Step Content ─── */}
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="space-y-10"
          >
            {/* Input form */}
            <div className="bg-surface rounded-2xl p-6 md:p-8 card-shadow max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "screenshots" ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "screenshots" ? -30 : 30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                >
                  {mode === "screenshots" ? (
                    <ScreenshotUploader onExtracted={handleExtracted} onAuthRequired={() => setShowAuthModal(true)} />
                  ) : (
                    <ManualForm onResult={handleManualResult} onAuthRequired={() => setShowAuthModal(true)} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* History */}
            <ValuationHistory />
          </motion.div>
        )}

        {step === "review" && extracted && valuationId && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="bg-surface rounded-2xl p-6 md:p-8 card-shadow max-w-2xl">
              <ExtractionReview
                valuationId={valuationId}
                extracted={extracted}
                onResult={handleReviewResult}
                onBack={reset}
              />
            </div>
          </motion.div>
        )}

        {step === "result" && result && property && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="space-y-6"
          >
            <motion.button
              onClick={reset}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 text-sm text-primary font-bold hover:underline"
            >
              <Icon name="arrow_back" className="text-base" />
              Nueva valuación
            </motion.button>
            <ValuationReport
              result={result}
              narrative={narrative}
              property={property}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
