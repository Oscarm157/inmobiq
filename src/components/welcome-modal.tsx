"use client"

import { useState, useEffect } from "react"
import { Icon } from "@/components/icon"

const STORAGE_KEY = "inmobiq_seen_welcome"

const SLIDES = [
  {
    icon: "location_on",
    title: "Explora el mercado",
    description: "Analiza precios, tendencias e inventario de más de 30 zonas inmobiliarias en Tijuana. Todo basado en datos reales del mercado.",
  },
  {
    icon: "compare_arrows",
    title: "Compara zonas",
    description: "Compara hasta 4 zonas lado a lado: precios por m², composición de oferta, demografía y riesgo. Encuentra la mejor zona para tu inversión.",
  },
  {
    icon: "explore",
    title: "Valúa propiedades",
    description: "Usa la Brújula Inmobiliaria para saber si una propiedad está a buen precio. Sube screenshots o ingresa datos manualmente y obtén un análisis al instante.",
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  const dismiss = () => {
    setOpen(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1)
    else dismiss()
  }

  if (!open) return null

  const slide = SLIDES[step]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Content */}
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Icon name={slide.icon} className="text-3xl text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">{slide.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{slide.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4">
          <button
            onClick={dismiss}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Saltar
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
          >
            {step < SLIDES.length - 1 ? (
              <>Siguiente <Icon name="arrow_forward" className="text-sm" /></>
            ) : (
              <>Empezar <Icon name="check" className="text-sm" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
