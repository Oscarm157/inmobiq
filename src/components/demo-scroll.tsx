"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Demo tour for video recording. Activate with ?demo=true.
 *
 * Scrolls to each section's title area with padding so the viewer
 * sees the heading first, reads it, then the content beneath.
 * Natural easing via CSS scroll-smooth. Longer pauses for context.
 */

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

// Pause durations per section (some need more time)
const SECTION_PAUSE: Record<string, number> = {
  "demo-header": 2500,      // Let them read the title + badges
  "demo-kpis": 2000,        // 3 KPI cards
  "demo-map": 2500,         // Map needs time to render
  "demo-table": 2200,       // Table title + first rows
  "demo-charts": 2000,      // First chart pair
  "demo-destacadas": 2000,  // Highlighted zones
  "demo-editorial": 2200,   // Analysis text
  "demo-zonas": 2500,       // Zone grid
}

const DEFAULT_PAUSE = 1800
const SCROLL_SETTLE = 1000  // Time for smooth scroll animation to finish
const TOP_OFFSET = 20       // px padding above section when scrolling to it

export function DemoScroll() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [totalSteps, setTotalSteps] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const timer2Ref = useRef<ReturnType<typeof setTimeout>>(undefined)

  const getSections = useCallback(() => {
    return TOUR_SECTIONS
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
  }, [])

  // Auto-start
  useEffect(() => {
    if (!isDemo) return
    const timer = setTimeout(() => startTour(), 1500)
    return () => clearTimeout(timer)
  }, [isDemo])

  const startTour = useCallback(() => {
    const sections = getSections()
    if (sections.length === 0) return
    // Start at top
    window.scrollTo({ top: 0, behavior: "smooth" })
    setTotalSteps(sections.length)
    setRunning(true)
    // Pause at top first, then begin
    timerRef.current = setTimeout(() => setStep(0), 1500)
  }, [getSections])

  const stopTour = useCallback(() => {
    setRunning(false)
    setStep(-1)
    clearTimeout(timerRef.current)
    clearTimeout(timer2Ref.current)
  }, [])

  // Drive the tour
  useEffect(() => {
    if (!running || step < 0) return

    const sections = getSections()
    if (step >= sections.length) {
      setRunning(false)
      return
    }

    const el = sections[step]
    const sectionId = TOUR_SECTIONS.find((id) => document.getElementById(id) === el) ?? ""
    const pauseMs = SECTION_PAUSE[sectionId] ?? DEFAULT_PAUSE

    // Scroll so the element's top is TOP_OFFSET px below the viewport top
    const rect = el.getBoundingClientRect()
    const absoluteTop = rect.top + window.scrollY - TOP_OFFSET
    window.scrollTo({ top: Math.max(0, absoluteTop), behavior: "smooth" })

    // Wait for scroll to finish, then hold, then next
    timerRef.current = setTimeout(() => {
      timer2Ref.current = setTimeout(() => {
        setStep((s) => s + 1)
      }, pauseMs)
    }, SCROLL_SETTLE)

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(timer2Ref.current)
    }
  }, [running, step, getSections])

  if (!isDemo) return null

  // Subtle play button
  if (!running && step === -1) {
    return (
      <button
        onClick={startTour}
        className="fixed bottom-5 right-5 z-[9999] w-7 h-7 rounded-full bg-black/15 hover:bg-black/40 hover:scale-110 flex items-center justify-center transition-all duration-300"
        aria-label="Iniciar demo"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" className="ml-0.5 text-slate-400">
          <polygon points="0,0 8,5 0,10" />
        </svg>
      </button>
    )
  }

  const pct = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] transition-all duration-700 ${
        !running && step >= totalSteps ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-500 ${
                i < step ? "bg-blue-400" : i === step ? "bg-white scale-150" : "bg-white/15"
              }`}
            />
          ))}
        </div>
        <button
          onClick={stopTour}
          className="w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Detener"
        >
          <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor" className="opacity-40">
            <rect width="5" height="5" rx="0.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
