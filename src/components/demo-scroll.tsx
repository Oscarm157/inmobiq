"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Demo auto-scroll mode for video recording.
 * Activate with ?demo=true in the URL.
 *
 * Scrolls smoothly through the page with pauses at regular intervals
 * so each section is visible for a moment. Professional and clean.
 */
export function DemoScroll() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [finished, setFinished] = useState(false)
  const rafRef = useRef<number>(0)
  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const currentY = useRef(0)
  const pixelsSincePause = useRef(0)

  // Tuning
  const SPEED = 1.2          // pixels per frame (~72px/sec at 60fps)
  const PAUSE_EVERY = 550    // pause every N pixels scrolled
  const PAUSE_MS = 1000      // 1 second pause
  const START_DELAY = 1500   // wait before starting

  const stop = useCallback(() => {
    setActive(false)
    cancelAnimationFrame(rafRef.current)
    clearTimeout(pauseRef.current)
  }, [])

  // Start on mount if demo=true
  useEffect(() => {
    if (!isDemo) return

    const timer = setTimeout(() => {
      window.scrollTo({ top: 0 })
      currentY.current = 0
      pixelsSincePause.current = 0
      setActive(true)
      setFinished(false)
      setProgress(0)
    }, START_DELAY)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(pauseRef.current)
    }
  }, [isDemo])

  // Animation loop
  useEffect(() => {
    if (!active) return

    let paused = false

    function step() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight <= 0 || currentY.current >= totalHeight) {
        setProgress(100)
        setFinished(true)
        setActive(false)
        return
      }

      if (paused) return

      currentY.current = Math.min(currentY.current + SPEED, totalHeight)
      window.scrollTo(0, currentY.current)
      pixelsSincePause.current += SPEED

      const pct = Math.round((currentY.current / totalHeight) * 100)
      setProgress(pct)

      // Check if it's time to pause
      if (pixelsSincePause.current >= PAUSE_EVERY) {
        paused = true
        pixelsSincePause.current = 0
        pauseRef.current = setTimeout(() => {
          paused = false
          rafRef.current = requestAnimationFrame(step)
        }, PAUSE_MS)
        return
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(pauseRef.current)
    }
  }, [active])

  if (!isDemo) return null

  // Minimal, elegant indicator
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ${
        finished ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-3 bg-slate-900/90 text-white pl-4 pr-3 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10">
        {/* Progress ring */}
        <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
          <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <circle
            cx="10" cy="10" r="8" fill="none" stroke="#3b82f6" strokeWidth="2"
            strokeDasharray={`${progress * 0.503} 50.3`}
            strokeLinecap="round"
            transform="rotate(-90 10 10)"
            className="transition-all duration-300"
          />
        </svg>

        <span className="text-xs font-bold tracking-wide">
          {active ? "DEMO" : "FIN"}
        </span>

        <div className="w-px h-4 bg-white/20" />

        <span className="text-xs font-mono text-white/60 w-8 text-right">
          {progress}%
        </span>

        {active && (
          <button
            onClick={stop}
            className="ml-1 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Detener demo"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <rect width="8" height="8" rx="1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
