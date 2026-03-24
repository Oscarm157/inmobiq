"use client"

import { useEffect, useState, useRef, useCallback } from "react"

// ─── Counter animation hook ────────────────────────────────────────────────

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) { setValue(0); return }
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, active])

  return value
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface DemoVideoProps {
  pricePerM2: number
  totalListings: number
  totalZones: number
  topZones: { name: string; pricePerM2: number; trend: number }[]
}

type Act = "idle" | "intro" | "kpis" | "mapa" | "tabla" | "cierre" | "done"

const ACT_DURATIONS: Record<Act, number> = {
  idle: 0,
  intro: 5000,
  kpis: 7500,
  mapa: 8000,
  tabla: 8000,
  cierre: 5000,
  done: 0,
}

const ACT_ORDER: Act[] = ["intro", "kpis", "mapa", "tabla", "cierre"]

// ─── Component ─────────────────────────────────────────────────────────────

export function DemoVideo({ pricePerM2, totalListings, totalZones, topZones }: DemoVideoProps) {
  const [act, setAct] = useState<Act>("idle")
  const [showContent, setShowContent] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const contentTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Counter values
  const cPrice = useCountUp(pricePerM2, 2000, act === "kpis")
  const cListings = useCountUp(totalListings, 2000, act === "kpis")
  const cZones = useCountUp(totalZones, 1500, act === "kpis")

  const startDemo = useCallback(() => {
    setAct("intro")
  }, [])

  // Advance acts
  useEffect(() => {
    if (act === "idle" || act === "done") return

    // Show content with slight delay for entrance animation
    setShowContent(false)
    contentTimerRef.current = setTimeout(() => setShowContent(true), 100)

    const idx = ACT_ORDER.indexOf(act)
    const duration = ACT_DURATIONS[act]

    timerRef.current = setTimeout(() => {
      setShowContent(false)
      // Brief gap between acts
      setTimeout(() => {
        if (idx < ACT_ORDER.length - 1) {
          setAct(ACT_ORDER[idx + 1])
        } else {
          setAct("done")
        }
      }, 400)
    }, duration)

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(contentTimerRef.current)
    }
  }, [act])

  // Format helpers
  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)
  const fmtNum = (v: number) => v.toLocaleString("es-MX")

  // Play button (when idle)
  if (act === "idle") {
    return (
      <button
        onClick={startDemo}
        className="fixed bottom-5 right-5 z-[9999] w-7 h-7 rounded-full bg-black/15 hover:bg-black/40 hover:scale-110 flex items-center justify-center transition-all duration-300"
        aria-label="Iniciar demo"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" className="ml-0.5 text-slate-400">
          <polygon points="0,0 8,5 0,10" />
        </svg>
      </button>
    )
  }

  // Done — hide
  if (act === "done") return null

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, #1e3a5f 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #1a1a3e 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ─── ACT 1: Intro ─── */}
      {act === "intro" && (
        <div className={`text-center transition-all duration-1000 ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <h1 className="text-7xl font-black text-white tracking-tight mb-4">
            Inmobiq
          </h1>
          <div className={`transition-all duration-1000 delay-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xl text-slate-400 font-medium tracking-wide">
              Inteligencia Inmobiliaria · Tijuana
            </p>
          </div>
          <div className={`mt-8 transition-all duration-1000 delay-[1500ms] ${showContent ? "opacity-100" : "opacity-0"}`}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto" />
          </div>
        </div>
      )}

      {/* ─── ACT 2: KPIs ─── */}
      {act === "kpis" && (
        <div className={`text-center max-w-4xl px-8 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-10">
            Market Overview
          </p>

          <div className="grid grid-cols-3 gap-12 mb-12">
            {/* Price */}
            <div className={`transition-all duration-700 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <p className="text-5xl font-black text-white tabular-nums">
                {fmtPrice(cPrice)}
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium">Precio promedio / m²</p>
            </div>

            {/* Listings */}
            <div className={`transition-all duration-700 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <p className="text-5xl font-black text-white tabular-nums">
                {fmtNum(cListings)}
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium">Propiedades activas</p>
            </div>

            {/* Zones */}
            <div className={`transition-all duration-700 delay-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <p className="text-5xl font-black text-white tabular-nums">
                {fmtNum(cZones)}
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium">Zonas monitoreadas</p>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-[1200ms] ${showContent ? "opacity-100" : "opacity-0"}`}>
            <p className="text-sm text-slate-600 font-medium">
              Datos agregados de los principales portales inmobiliarios
            </p>
          </div>
        </div>
      )}

      {/* ─── ACT 3: Mapa ─── */}
      {act === "mapa" && (
        <div className={`text-center max-w-5xl w-full px-8 transition-all duration-700 ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-6">
            Cobertura Geográfica
          </p>

          {/* Map placeholder — dark styled box with zone dots */}
          <div className="relative bg-slate-900/80 rounded-2xl border border-slate-800 p-8 mx-auto" style={{ height: 380 }}>
            {/* Simulated map grid */}
            <div className="absolute inset-8 border border-slate-800/50 rounded-lg" />
            <div className="absolute inset-12 border border-slate-800/30 rounded-lg" />

            {/* Animated zone dots */}
            {topZones.slice(0, 8).map((z, i) => {
              const positions = [
                { left: "25%", top: "30%" }, { left: "45%", top: "25%" },
                { left: "60%", top: "35%" }, { left: "35%", top: "55%" },
                { left: "55%", top: "50%" }, { left: "70%", top: "45%" },
                { left: "30%", top: "70%" }, { left: "50%", top: "65%" },
              ]
              const pos = positions[i] ?? positions[0]
              return (
                <div
                  key={z.name}
                  className={`absolute transition-all duration-500 ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                  style={{ left: pos.left, top: pos.top, transitionDelay: `${600 + i * 200}ms` }}
                >
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="absolute left-5 top-[-4px] text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {z.name}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Center label */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 delay-[2000ms] ${showContent ? "opacity-100" : "opacity-0"}`}>
              <div className="bg-slate-950/90 px-6 py-3 rounded-xl border border-slate-700">
                <p className="text-3xl font-black text-white">{totalZones}</p>
                <p className="text-xs text-slate-400 font-bold">zonas en Tijuana</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACT 4: Tabla ─── */}
      {act === "tabla" && (
        <div className={`max-w-3xl w-full px-8 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-6 text-center">
            Precio por Zona
          </p>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Zona</span>
              <span className="text-right">Precio / m²</span>
              <span className="text-right">Tendencia</span>
              <span className="text-right">Actividad</span>
            </div>

            {/* Rows */}
            {topZones.slice(0, 6).map((z, i) => (
              <div
                key={z.name}
                className={`grid grid-cols-4 gap-4 px-6 py-3.5 border-b border-slate-800/50 transition-all duration-500 ${
                  showContent ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
              >
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-500"
                  }`}>
                    {i + 1}
                  </span>
                  {z.name}
                </span>
                <span className="text-sm font-bold text-white text-right tabular-nums">
                  {fmtPrice(z.pricePerM2)}
                </span>
                <span className={`text-sm font-bold text-right ${z.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {z.trend >= 0 ? "+" : ""}{z.trend.toFixed(1)}%
                </span>
                <span className="text-right">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400">
                    Activa
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className={`text-center text-xs text-slate-600 mt-4 transition-all duration-500 delay-[1500ms] ${showContent ? "opacity-100" : "opacity-0"}`}>
            Precio · Renta · Yield · Tendencia — actualizado semanalmente
          </p>
        </div>
      )}

      {/* ─── ACT 5: Cierre ─── */}
      {act === "cierre" && (
        <div className={`text-center transition-all duration-1000 ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <h1 className="text-7xl font-black text-white tracking-tight mb-4">
            Inmobiq
          </h1>
          <div className={`transition-all duration-1000 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xl text-slate-400 font-medium">
              El mercado, en datos
            </p>
          </div>
          <div className={`mt-8 transition-all duration-1000 delay-1000 ${showContent ? "opacity-100" : "opacity-0"}`}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto" />
          </div>
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={() => setAct("done")}
        className="absolute bottom-6 right-6 text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-medium"
      >
        ESC
      </button>
    </div>
  )
}
