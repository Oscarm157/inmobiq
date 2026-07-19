"use client"

import Link from "next/link"
import { motion } from "motion/react"

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

export function Hero() {
  return (
    <section className="m-band-dark relative min-h-[94svh] flex flex-col overflow-hidden">
      {/* Media generada full-bleed: video de la visualización 3D de precios */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 42%" }}
        autoPlay
        muted
        loop
        playsInline
        poster="/marketing/hero-prices.jpg"
        aria-hidden="true"
      >
        <source src="/marketing/hero-prices.webm" type="video/webm" />
        <source src="/marketing/hero-prices.mp4" type="video/mp4" />
      </video>

      {/* Scrims para legibilidad */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,17,32,0.78) 0%, rgba(10,17,32,0.32) 30%, rgba(10,17,32,0.35) 62%, rgba(10,17,32,0.94) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,17,32,0.88) 0%, rgba(10,17,32,0.35) 46%, rgba(10,17,32,0) 78%)",
        }}
      />

      {/* Etiquetas de precio flotantes sobre las columnas (desktop) */}
      <PriceTag className="hidden lg:flex top-[30%] right-[15%]" zone="Zona Río" price="$41,200" />
      <PriceTag className="hidden lg:flex top-[46%] right-[31%]" zone="Otay" price="$28,600" />
      <PriceTag className="hidden xl:flex top-[38%] right-[7%]" zone="Playas" price="$33,900" />
      <div
        className="absolute -bottom-40 left-1/4 w-[60%] h-[60%] pointer-events-none blur-3xl opacity-60"
        aria-hidden="true"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 65%)" }}
      />

      {/* Contenido */}
      <div className="relative flex-1 flex items-center">
        <div className="w-full max-w-[1240px] mx-auto px-5 md:px-8 pt-24 md:pt-28">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[15ch] md:max-w-[900px]">
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
              <span className="m-badge-dark">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(52,211,153,0.7)" }} />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }} />
                </span>
                Tijuana · 30 zonas · datos públicos
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="m-hero-display mt-6 text-[var(--m-on-dark)]"
            >
              El mercado inmobiliario de Tijuana,{" "}
              <span style={{ color: "var(--m-emerald-light)" }}>por zona.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-7 text-[1.0625rem] md:text-[1.1875rem] leading-[1.5] text-[var(--m-on-dark-soft)] max-w-[52ch]"
            >
              Precios por m², tendencias, riesgo y demografía del Censo INEGI en 30 zonas.
              Información pública del mercado, ordenada para quien compra, renta, invierte o desarrolla.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link href="/login?mode=register" className="m-btn-light">
                Crear cuenta gratis
              </Link>
              <Link href="/app" className="m-btn-ghost-light">
                Ver el dashboard
                <span aria-hidden>→</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Ticker de datos en vivo */}
      <div className="relative w-full max-w-[1240px] mx-auto px-5 md:px-8 pb-8 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="m-ticker w-full md:w-auto md:inline-flex"
        >
          <TickerCell label="Zona Centro · venta" value="$34,820" unit="/m²" />
          <TickerCell label="Tendencia 90 días" value="↑ 4.2%" accent />
          <TickerCell label="Inventario activo" value="248" unit="listings" />
          <TickerCell label="Riesgo de zona" value="Bajo" accent />
        </motion.div>
      </div>
    </section>
  )
}

function PriceTag({ className, zone, price }: { className?: string; zone: string; price: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.9 }}
      className={`absolute z-10 items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full pointer-events-none ${className || ""}`}
      style={{
        background: "rgba(10,17,32,0.72)",
        border: "1px solid rgba(52,211,153,0.4)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: "0 0 24px -6px rgba(16,185,129,0.5)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
      <span className="text-[13px]" style={{ fontWeight: 500, color: "var(--m-on-dark)", letterSpacing: "-0.01em" }}>
        {price}<span className="text-[10px] text-[var(--m-on-dark-faint)]"> /m²</span>
      </span>
      <span className="text-[11px] text-[var(--m-on-dark-soft)]">{zone}</span>
    </motion.div>
  )
}

function TickerCell({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className="m-ticker-cell flex-1 md:flex-none">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--m-on-dark-faint)]">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5" style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", color: accent ? "var(--m-emerald-light)" : "var(--m-on-dark)" }}>
        {value}
        {unit && <span className="text-[12px] text-[var(--m-on-dark-faint)]" style={{ fontWeight: 400 }}>{unit}</span>}
      </p>
    </div>
  )
}

export function Sparkline() {
  const points = [42, 40, 44, 43, 47, 46, 50, 48, 52, 55, 53, 58]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const w = 280
  const h = 60
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / (max - min)) * h
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" aria-hidden="true">
      <defs>
        <linearGradient id="m-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(16,185,129,0.30)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#m-spark-fill)" />
      <path d={path} fill="none" stroke="rgb(16,185,129)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
