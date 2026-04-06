"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/icon"
import { useAuth } from "@/contexts/auth-context"
import { PERFIL_CONFIGS, PERFIL_KEYS, type PerfilType } from "@/lib/profiles"
import { setPreferredPerfil, setPreferredOperacion, setPreferredCategoria } from "@/lib/preference-cookies"

// ── Tour step definitions ──

interface TourStep {
  targetSelector: string | null // null = fullscreen modal
  title: string
  description: string
  position: "right" | "bottom" | "center"
  preview: React.ReactNode
}

// Full tour for authenticated users (9 steps)
const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: null,
    title: "Bienvenido a Inmobiq",
    description: "Inteligencia inmobiliaria para Tijuana",
    position: "center",
    preview: null,
  },
  {
    targetSelector: '[data-tour="precios"]',
    title: "Precios del Mercado",
    description: "¿Cuánto cuesta el m² en Tijuana hoy? Aquí ves de un vistazo qué zonas están caras, cuáles son más accesibles, y hacia dónde van los precios.",
    position: "right",
    preview: <MiniBarChart />,
  },
  {
    targetSelector: '[data-tour="brujula"]',
    title: "Brújula Inmobiliaria",
    description: "¿Tienes una propiedad y quieres saber cuánto vale? Ingresa la zona y te damos un estimado basado en lo que realmente se está vendiendo ahí.",
    position: "right",
    preview: <MiniValuator />,
  },
  {
    targetSelector: '[data-tour="zonas"]',
    title: "Análisis por Zona",
    description: "Ejemplo: quieres comprar en Playas. Aquí ves el precio típico, cuántas propiedades hay, si los precios suben o bajan, y qué tipo de propiedad domina la zona.",
    position: "right",
    preview: <MiniZoneCards />,
  },
  {
    targetSelector: '[data-tour="comparar"]',
    title: "Comparador de Zonas",
    description: "¿Zona Río o Playas? Ponlas lado a lado y compara precios, oferta, riesgo y perfil de cada una para decidir mejor.",
    position: "right",
    preview: <MiniComparison />,
  },
  {
    targetSelector: '[data-tour="riesgo"]',
    title: "Análisis de Riesgo",
    description: "¿Es seguro invertir en esta zona? Aquí ves qué tan estables son los precios, qué tan rápido se venden las propiedades, y un score general de riesgo.",
    position: "right",
    preview: <MiniGauge />,
  },
  {
    targetSelector: '[data-tour="mode-tabs"]',
    title: "Compra-Venta o Renta",
    description: "¿Buscas comprar o rentar? Cambia aquí y toda la información se ajusta: precios de venta o montos de renta, según lo que necesites.",
    position: "bottom",
    preview: <MiniToggle />,
  },
  {
    targetSelector: "#demo-kpis",
    title: "Números que Importan",
    description: "Cuánto cuesta el metro cuadrado en promedio, el precio típico de una propiedad, y cómo se mueve el mercado esta semana. Todo de un vistazo.",
    position: "bottom",
    preview: <MiniKPIs />,
  },
  {
    targetSelector: null,
    title: "Estás en la Beta Privada",
    description: "",
    position: "center",
    preview: null,
  },
]

// Short tour for anonymous users (4 steps)
const ANON_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: null,
    title: "Bienvenido a Inmobiq",
    description: "Inteligencia inmobiliaria para el mercado de Tijuana. Precios, tendencias, análisis por zona y herramientas de valuación — todo en un solo lugar.",
    position: "center",
    preview: null,
  },
  {
    targetSelector: '[data-tour="precios"]',
    title: "Precios del Mercado",
    description: "¿Cuánto cuesta el m² en Tijuana hoy? Aquí ves de un vistazo qué zonas están caras, cuáles son más accesibles, y hacia dónde van los precios.",
    position: "right",
    preview: <MiniBarChart />,
  },
  {
    targetSelector: '[data-tour="brujula"]',
    title: "Brújula Inmobiliaria",
    description: "¿Tienes una propiedad y quieres saber cuánto vale? Compárala al instante contra el mercado de su zona.",
    position: "right",
    preview: <MiniValuator />,
  },
  {
    targetSelector: '[data-tour="zonas"]',
    title: "Análisis por Zona",
    description: "30 zonas de Tijuana con precios, tendencias, composición de oferta y perfil demográfico. Datos reales actualizados cada semana.",
    position: "right",
    preview: <MiniZoneCards />,
  },
  {
    targetSelector: null,
    title: "Accede a toda la inteligencia",
    description: "",
    position: "center",
    preview: null,
  },
]

const STORAGE_KEY = "inmobiq_tour_completed"
const ANON_STORAGE_KEY = "inmobiq_anon_tour_completed"

// ── Spotlight overlay ──

function SpotlightOverlay({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return <div className="fixed inset-0 z-[200] bg-black/60 transition-all duration-500" />
  }

  const pad = 10
  const r = 14
  const x = rect.left - pad
  const y = rect.top - pad
  const w = rect.width + pad * 2
  const h = rect.height + pad * 2

  return (
    <div className="fixed inset-0 z-[200] transition-all duration-500">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#spotlight-mask)" />
      </svg>
    </div>
  )
}

// ── Premium Tooltip ──

interface TooltipProps {
  step: TourStep
  rect: DOMRect | null
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  children?: React.ReactNode
}

function TourTooltip({ step, rect, currentStep, totalSteps, onNext, onPrev, onSkip, children }: TooltipProps) {
  const isFullscreen = step.targetSelector === null
  const isLast = currentStep === totalSteps - 1
  const isFirst = currentStep === 0

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-lg w-full p-10 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-transparent" />

          <h2 className="text-2xl font-extrabold tracking-tight text-center mb-2">{step.title}</h2>
          {step.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">{step.description}</p>
          )}
          {children}
          {!isFirst && (
            <div className="flex items-center justify-between mt-8">
              <button onClick={onPrev} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">
                Anterior
              </button>
              {isLast ? (
                <button
                  onClick={onNext}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                >
                  Explorar el mercado
                </button>
              ) : (
                <button onClick={onNext} className="px-5 py-2 bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Siguiente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Positioned tooltip
  if (!rect) return null

  const tooltipStyle: React.CSSProperties = {}
  let arrowPos = ""

  if (step.position === "right") {
    tooltipStyle.top = rect.top
    tooltipStyle.left = rect.right + 18
    arrowPos = "before:absolute before:top-6 before:-left-[6px] before:w-3 before:h-3 before:bg-white dark:before:bg-slate-900 before:rotate-45"
  } else if (step.position === "bottom") {
    tooltipStyle.top = rect.bottom + 18
    tooltipStyle.left = rect.left
    arrowPos = "before:absolute before:-top-[6px] before:left-8 before:w-3 before:h-3 before:bg-white dark:before:bg-slate-900 before:rotate-45"
  }

  return (
    <div
      className={`fixed z-[201] w-80 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${arrowPos}`}
      style={tooltipStyle}
    >
      {/* Preview */}
      {step.preview && (
        <div className="mb-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 flex items-center justify-center">
          {step.preview}
        </div>
      )}

      <h3 className="text-lg font-extrabold tracking-tight mb-1.5">{step.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{step.description}</p>

      {/* Progress + nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentStep ? "bg-blue-500 scale-110" : i < currentStep ? "bg-blue-300 dark:bg-blue-700" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSkip} className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">
            Saltar
          </button>
          {currentStep > 0 && (
            <button onClick={onPrev} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Icon name="arrow_back" className="text-sm" />
            </button>
          )}
          <button
            onClick={onNext}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-blue-600/20"
          >
            {isLast ? "Listo" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main tour component ──

interface GuidedTourProps {
  forceOpen?: boolean
  onClose?: () => void
}

export function GuidedTour({ forceOpen, onClose }: GuidedTourProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [skipProfileStep, setSkipProfileStep] = useState(false)
  const rafRef = useRef<number>(undefined)

  const isAnon = !user
  const steps = isAnon ? ANON_TOUR_STEPS : TOUR_STEPS
  const storageKey = isAnon ? ANON_STORAGE_KEY : STORAGE_KEY

  // Auto-launch on first visit
  useEffect(() => {
    if (authLoading) return
    if (forceOpen) {
      setActive(true)
      setCurrentStep(0)
      setSkipProfileStep(true)
      return
    }
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      const timer = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(timer)
    }
  }, [forceOpen, authLoading, storageKey])

  // Track target element position
  useEffect(() => {
    if (!active) return
    const step = getEffectiveStep()
    if (!step || !step.targetSelector) {
      setTargetRect(null)
      return
    }

    const update = () => {
      const el = document.querySelector(step.targetSelector!)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
      rafRef.current = requestAnimationFrame(update)
    }
    update()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, currentStep, skipProfileStep])

  const getEffectiveStep = () => {
    if (isAnon) return steps[currentStep]
    if (skipProfileStep && currentStep === 0) return steps[1]
    return steps[skipProfileStep ? currentStep + 1 : currentStep]
  }

  const effectiveTotal = isAnon ? steps.length : (skipProfileStep ? steps.length - 1 : steps.length)

  const handleNext = useCallback(() => {
    if (currentStep >= effectiveTotal - 1) {
      closeTour()
      return
    }
    setCurrentStep((s) => s + 1)
  }, [currentStep, effectiveTotal])

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const closeTour = useCallback(() => {
    setActive(false)
    localStorage.setItem(storageKey, "true")
    onClose?.()
    router.refresh()
  }, [onClose, router, storageKey])

  const handleProfileSelect = useCallback((perfil: PerfilType) => {
    const config = PERFIL_CONFIGS[perfil]
    setPreferredPerfil(perfil)
    setPreferredOperacion(config.defaultOperacion)
    setPreferredCategoria(config.defaultCategoria)
    fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil }),
    }).catch(() => {})
    setCurrentStep(1)
  }, [])

  if (!active) return null

  const step = getEffectiveStep()
  if (!step) return null

  const isProfileStep = !isAnon && !skipProfileStep && currentStep === 0
  const isAnonCTA = isAnon && currentStep === effectiveTotal - 1
  const isBetaStep = !isAnon && step.targetSelector === null && currentStep === effectiveTotal - 1

  return (
    <>
      <SpotlightOverlay rect={targetRect} />
      <TourTooltip
        step={step}
        rect={targetRect}
        currentStep={currentStep}
        totalSteps={effectiveTotal}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={closeTour}
      >
        {/* Step 0: Profile selection (authenticated only) */}
        {isProfileStep && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Personaliza tu experiencia. Puedes cambiar esto cuando quieras.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PERFIL_KEYS.map((key) => {
                const config = PERFIL_CONFIGS[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleProfileSelect(key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:shadow-md transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <Icon name={config.icon} className="text-xl" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{config.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{config.description}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => handleProfileSelect("broker")}
              className="w-full mt-3 py-2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
            >
              Explorar libremente
            </button>
          </>
        )}

        {/* Anonymous welcome (step 0) */}
        {isAnon && currentStep === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
              <Icon name="monitoring" className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={closeTour} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
                Saltar
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                Ver qué ofrece
              </button>
            </div>
          </div>
        )}

        {/* Anonymous CTA (last step) */}
        {isAnonCTA && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Icon name="lock_open" className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Crea tu cuenta gratis para acceder a análisis completos por zona, comparador, riesgo de inversión y la Brújula Inmobiliaria.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={closeTour}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                <Icon name="person_add" className="text-base" />
                Crear cuenta gratis
              </Link>
              <button
                onClick={closeTour}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors py-1"
              >
                Seguir explorando
              </button>
            </div>
          </div>
        )}

        {/* Beta badge (authenticated, last step) */}
        {isBetaStep && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Beta Privada</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Estás entre los primeros en usar Inmobiq. Estamos invirtiendo en investigación y desarrollo para robustecer la plataforma con más datos, más zonas y mejores herramientas de análisis.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lanzamiento público</p>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">27 de Abril, 2026</p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Tu feedback es clave para mejorar. Cualquier cosa que notes, nos ayuda a construir una mejor herramienta.
            </p>
          </div>
        )}
      </TourTooltip>
    </>
  )
}

// ── SVG Mini Previews ──

function MiniBarChart() {
  return (
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="25" width="16" height="40" rx="3" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="28" y="15" width="16" height="50" rx="3" className="fill-slate-400 dark:fill-slate-500" />
      <rect x="48" y="8" width="16" height="57" rx="3" className="fill-blue-500" />
      <rect x="68" y="20" width="16" height="45" rx="3" className="fill-slate-400 dark:fill-slate-500" />
      <rect x="88" y="30" width="16" height="35" rx="3" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="108" y="12" width="16" height="53" rx="3" className="fill-slate-400 dark:fill-slate-500" />
      <line x1="4" y1="66" x2="130" y2="66" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
      <text x="14" y="7" className="fill-blue-500" fontSize="7" fontWeight="bold">$25K/m²</text>
    </svg>
  )
}

function MiniValuator() {
  return (
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="40" height="35" rx="4" className="fill-slate-200 dark:fill-slate-700" />
      <polygon points="20,22 40,5 60,22" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="33" y="35" width="14" height="20" rx="2" className="fill-slate-400 dark:fill-slate-500" />
      <rect x="75" y="15" width="50" height="14" rx="4" className="fill-blue-100 dark:fill-blue-900" />
      <text x="80" y="25" className="fill-blue-600 dark:fill-blue-400" fontSize="8" fontWeight="bold">$3.2M</text>
      <rect x="75" y="34" width="50" height="10" rx="3" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="75" y="34" width="35" height="10" rx="3" className="fill-green-400 dark:fill-green-600" />
      <text x="78" y="42" className="fill-white" fontSize="6" fontWeight="bold">Precio justo</text>
    </svg>
  )
}

function MiniZoneCards() {
  return (
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 46 + 2}, 5)`}>
          <rect width="42" height="58" rx="6" strokeWidth="0.5" className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" />
          <rect x="6" y="8" width="30" height="4" rx="1" className="fill-slate-300 dark:fill-slate-600" />
          <rect x="6" y="16" width="20" height="3" rx="1" className="fill-slate-200 dark:fill-slate-700" />
          <rect x="6" y="25" width="15" height="8" rx="2" className="fill-blue-100 dark:fill-blue-900" />
          <text x="8" y="32" className="fill-blue-600 dark:fill-blue-400" fontSize="5" fontWeight="bold">$18K</text>
          <rect x="6" y="38" width="30" height="3" rx="1" className="fill-slate-100 dark:fill-slate-800" />
          <rect x="6" y="38" width={`${[20, 28, 14][i]}`} height="3" rx="1" className="fill-slate-400 dark:fill-slate-500" />
          <rect x="6" y="46" width="30" height="3" rx="1" className="fill-slate-100 dark:fill-slate-800" />
          <rect x="6" y="46" width={`${[25, 18, 22][i]}`} height="3" rx="1" className="fill-blue-400 dark:fill-blue-600" />
        </g>
      ))}
    </svg>
  )
}

function MiniComparison() {
  return (
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="58" height="60" rx="6" className="fill-slate-50 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" />
      <rect x="77" y="5" width="58" height="60" rx="6" className="fill-slate-50 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" />
      <text x="12" y="18" className="fill-slate-700 dark:fill-slate-300" fontSize="7" fontWeight="bold">Zona Río</text>
      <text x="84" y="18" className="fill-slate-700 dark:fill-slate-300" fontSize="7" fontWeight="bold">Playas</text>
      <rect x="12" y="24" width="44" height="5" rx="2" className="fill-blue-400" />
      <rect x="84" y="24" width="34" height="5" rx="2" className="fill-blue-300" />
      <rect x="12" y="33" width="30" height="5" rx="2" className="fill-slate-400" />
      <rect x="84" y="33" width="38" height="5" rx="2" className="fill-slate-400" />
      <rect x="12" y="42" width="38" height="5" rx="2" className="fill-green-400" />
      <rect x="84" y="42" width="28" height="5" rx="2" className="fill-green-400" />
      <circle cx="70" cy="35" r="10" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" />
      <text x="65" y="38" className="fill-slate-500" fontSize="8" fontWeight="bold">VS</text>
    </svg>
  )
}

function MiniGauge() {
  return (
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 30 55 A 35 35 0 0 1 110 55" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 30 55 A 35 35 0 0 1 85 22" className="stroke-green-400" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="70" cy="50" r="4" className="fill-slate-700 dark:fill-slate-300" />
      <line x1="70" y1="50" x2="82" y2="28" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" strokeLinecap="round" />
      <text x="50" y="68" className="fill-slate-700 dark:fill-slate-300" fontSize="9" fontWeight="bold">Score: 72</text>
      <text x="25" y="15" className="fill-green-500" fontSize="6">Bajo</text>
      <text x="100" y="15" className="fill-red-500" fontSize="6">Alto</text>
    </svg>
  )
}

function MiniToggle() {
  return (
    <svg width="140" height="50" viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="55" height="30" rx="8" className="fill-slate-800 dark:fill-blue-600" />
      <text x="17" y="29" className="fill-white" fontSize="8" fontWeight="bold">Venta</text>
      <rect x="70" y="10" width="55" height="30" rx="8" className="fill-slate-200 dark:fill-slate-700" />
      <text x="80" y="29" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontWeight="bold">Renta</text>
      <path d="M 60 30 L 80 30" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  )
}

function MiniKPIs() {
  return (
    <svg width="140" height="55" viewBox="0 0 140 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 46 + 2}, 4)`}>
          <rect width="42" height="46" rx="6" className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" />
          <rect x="6" y="8" width="8" height="8" rx="3" className={["fill-blue-100 dark:fill-blue-900", "fill-violet-100 dark:fill-violet-900", "fill-indigo-100 dark:fill-indigo-900"][i]} />
          <rect x="18" y="9" width="18" height="3" rx="1" className="fill-slate-200 dark:fill-slate-700" />
          <text x="6" y="30" className="fill-slate-700 dark:fill-slate-300" fontSize="8" fontWeight="bold">
            {["$18K", "$2.8M", "Alta"][i]}
          </text>
          <rect x="6" y="36" width="25" height="3" rx="1" className={["fill-green-300", "fill-slate-300", "fill-blue-300"][i]} />
        </g>
      ))}
    </svg>
  )
}
