"use client"

import { useSidebar } from "@/components/sidebar-provider"
import { Icon } from "@/components/icon"

const NARRATIVA_URL = "https://narrativa360.vercel.app/arq-mkt"

/**
 * Narrativa promotional module for the sidebar.
 * Light mode branding matching arq-mkt: warm white (#FAFAF8), Venice red (#E84D1A), Playfair Display.
 */
export function NarrativaPromo() {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return (
      <a
        href={NARRATIVA_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Narrativa — De visitante a cliente cerrado"
        className="group relative flex justify-center py-3"
      >
        <div className="w-9 h-9 rounded-lg bg-[#FAFAF8] border border-[#e8e4df] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
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
      className="group block mx-1 rounded-[6px] overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
    >
      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-[#E84D1A] via-[#f09060] to-[#E84D1A]/0" />

      <div className="relative bg-[#FAFAF8] p-4 space-y-2.5">
        {/* Subtle warm glow */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#E84D1A]/[0.04] rounded-full blur-2xl pointer-events-none" />

        {/* Wordmark + external icon */}
        <div className="flex items-center justify-between">
          <span
            className="text-[#E84D1A] text-[13px] font-bold italic tracking-wide"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Narrativa
          </span>
          <Icon name="open_in_new" className="text-[10px] text-[#1A1A1A]/15 group-hover:text-[#1A1A1A]/30 transition-colors" />
        </div>

        {/* Headline */}
        <p
          className="text-[#1A1A1A] text-[15px] font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          De visitante a<br />
          <span className="text-[#E84D1A]">cliente cerrado</span>
        </p>

        {/* Features */}
        <p className="text-[#737373] text-[10px] font-medium tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
          Landing · Quiz · Sofía IA · CRM
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#E84D1A] rounded-full px-3.5 py-1.5 w-fit shadow-sm shadow-[#E84D1A]/15 group-hover:shadow-[#E84D1A]/30 group-hover:bg-[#d4431a] transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Conoce más
          <Icon name="arrow_forward" className="text-[10px]" />
        </div>
      </div>
    </a>
  )
}
