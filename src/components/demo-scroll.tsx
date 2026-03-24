"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Demo tour mode for video recording.
 * Activate with ?demo=true in the URL.
 *
 * Scrolls to each key section, pauses to let it breathe, then moves on.
 * Uses native smooth scroll for natural easing.
 * Subtle play button — only visible if you know it's there.
 */

// Sections to visit (by ID). The component finds whichever exist on the page.
const TOUR_SECTIONS = [
  "demo-header",
  "demo-kpis",
  "demo-map",
  "demo-table",
  "demo-charts",
  "demo-destacadas",
  "demo-editorial",
  "demo-zonas",
]

const PAUSE_BETWEEN = 1500 // ms to pause at each section
const SCROLL_SETTLE = 800  // ms to wait for smooth scroll to finish

export function DemoScroll() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [totalSteps, setTotalSteps] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Find which sections exist on this page
  const getSections = useCallback(() => {
    return TOUR_SECTIONS
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
  }, [])

  // Auto-start if ?demo=true
  useEffect(() => {
    if (!isDemo) return
    const timer = setTimeout(() => startTour(), 1200)
    return () => clearTimeout(timer)
  }, [isDemo])

  const startTour = useCallback(() => {
    const sections = getSections()
    if (sections.length === 0) return

    window.scrollTo({ top: 0 })
    setTotalSteps(sections.length)
    setStep(0)
    setRunning(true)
  }, [getSections])

  const stopTour = useCallback(() => {
    setRunning(false)
    setStep(-1)
    clearTimeout(timerRef.current)
  }, [])

  // Drive the tour forward
  useEffect(() => {
    if (!running || step < 0) return

    const sections = getSections()
    if (step >= sections.length) {
      // Tour complete
      setRunning(false)
      return
    }

    const el = sections[step]
    el.scrollIntoView({ behavior: "smooth", block: "start" })

    // Wait for scroll to settle, then pause, then advance
    timerRef.current = setTimeout(() => {
      timerRef.current = setTimeout(() => {
        setStep((s) => s + 1)
      }, PAUSE_BETWEEN)
    }, SCROLL_SETTLE)

    return () => clearTimeout(timerRef.current)
  }, [running, step, getSections])

  if (!isDemo) return null

  // Subtle play button — small, semi-transparent, bottom-right
  if (!running && step === -1) {
    return (
      <button
        onClick={startTour}
        className="fixed bottom-5 right-5 z-[9999] w-8 h-8 rounded-full bg-slate-900/30 hover:bg-slate-900/60 hover:scale-110 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        aria-label="Iniciar demo"
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="white" className="ml-0.5 opacity-60">
          <polygon points="0,0 10,6 0,12" />
        </svg>
      </button>
    )
  }

  // Progress indicator while running
  const pct = totalSteps > 0 ? Math.round(((step) / totalSteps) * 100) : 0

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] transition-all duration-500 ${
        !running && step >= totalSteps ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2.5 bg-slate-900/80 text-white px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md border border-white/10">
        {/* Step dots */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i < step ? "bg-blue-400" : i === step ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] font-mono text-white/50">{pct}%</span>

        <button
          onClick={stopTour}
          className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          aria-label="Detener"
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="opacity-60">
            <rect width="6" height="6" rx="0.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
