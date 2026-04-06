"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"

interface BrujulaFloatProps {
  slug: string
  zoneName: string
}

export function BrujulaFloat({ slug, zoneName }: BrujulaFloatProps) {
  const [minimized, setMinimized] = useState(false)

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Valuar propiedad"
      >
        <Icon name="explore" className="text-xl" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <a
        href={`/brujula?zone=${slug}`}
        className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-2xl shadow-black/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Minimize button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMinimized(true) }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/[0.1] hover:bg-white/[0.2] flex items-center justify-center transition-colors z-10"
          title="Minimizar"
        >
          <Icon name="close" className="text-white/60 text-xs" />
        </button>

        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/[0.1] rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-8 w-32 h-32 bg-cyan-500/[0.07] rounded-full blur-2xl" />
        </div>

        <div className="relative flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/[0.15] flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="explore" className="text-blue-400 text-lg" />
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-white font-extrabold text-sm leading-tight mb-1">
              ¿Cuánto vale una propiedad aquí?
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-2.5">
              Valuación estimada con datos reales de {zoneName}
            </p>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors group-hover:shadow-lg group-hover:shadow-blue-600/20">
              <Icon name="arrow_forward" className="text-xs" />
              Valuar con Brújula
            </span>
          </div>
        </div>
      </a>
    </div>
  )
}
