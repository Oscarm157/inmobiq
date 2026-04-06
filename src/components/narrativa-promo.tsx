"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "@/components/sidebar-provider"
import { Icon } from "@/components/icon"

const NARRATIVA_URL = "https://narrativa360.vercel.app/arq-mkt"

// Pulse animation at 30s, 60s, 120s — then stop
const PULSE_TIMES = [30_000, 60_000, 120_000]

/**
 * Narrativa promotional module for the sidebar.
 * Light mode branding matching arq-mkt: warm white, Venice red, Playfair Display.
 * Subtle attention animation at 30s, 60s, 120s — then stays static.
 */
export function NarrativaPromo() {
  const { collapsed } = useSidebar()
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const timers = PULSE_TIMES.map((ms) =>
      setTimeout(() => {
        setPulse(true)
        setTimeout(() => setPulse(false), 1200)
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  if (collapsed) {
    return (
      <a
        href={NARRATIVA_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Narrativa — ¿Tienes un proyecto inmobiliario?"
        className="group relative flex justify-center py-3"
      >
        <div className={`w-9 h-9 rounded-lg bg-[#FAFAF8] border border-[#e8e4df] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 ${pulse ? "narrativa-pulse" : ""}`}>
          <span
            className="text-[#E84D1A] text-sm font-bold italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            N
          </span>
        </div>
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E84D1A] animate-pulse" />
      </a>
    )
  }

  return (
    <a
      href={NARRATIVA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block mx-1 rounded-xl overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-lg ${pulse ? "narrativa-pulse" : ""}`}
    >
      {/* Accent gradient line */}
      <div className="h-[3px] bg-gradient-to-r from-[#E84D1A] via-[#f4a574] to-[#E84D1A]" />

      <div className="relative bg-gradient-to-br from-[#FAFAF8] to-[#FFF5F0] p-4 pb-5 space-y-3">
        {/* Warm glow decorations */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#E84D1A]/[0.06] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#f4a574]/[0.08] rounded-full blur-xl pointer-events-none" />

        {/* Wordmark + external icon */}
        <div className="flex items-center justify-between">
          <span
            className="text-[#E84D1A] text-[17px] font-bold italic tracking-wide"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Narrativa
          </span>
          <Icon name="open_in_new" className="text-[10px] text-[#1A1A1A]/15 group-hover:text-[#E84D1A]/40 transition-colors" />
        </div>

        {/* Question hook */}
        <p
          className="text-[#1A1A1A]/60 text-[11px] font-semibold"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ¿Tienes un proyecto inmobiliario?
        </p>

        {/* Headline */}
        <p
          className="text-[#1A1A1A] text-[15px] font-bold leading-tight"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          De visitante a<br />
          <span className="text-[#E84D1A]">cliente cerrado</span>
          {" "}con IA
        </p>

        {/* CTA */}
        <div
          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-[#E84D1A] to-[#d4431a] rounded-full px-4 py-2 w-full shadow-md shadow-[#E84D1A]/20 group-hover:shadow-[#E84D1A]/40 transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Conoce más
          <Icon name="arrow_forward" className="text-[10px]" />
        </div>
      </div>
    </a>
  )
}
