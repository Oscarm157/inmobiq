"use client"

import Link from "next/link"
import { motion } from "motion/react"

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 75% 0%, rgba(16, 185, 129, 0.09) 0%, transparent 60%), radial-gradient(ellipse 70% 40% at 25% 10%, rgba(59, 130, 246, 0.07) 0%, transparent 65%)",
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 pt-12 md:pt-24 pb-16 md:pb-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center"
        >
          <div>
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
              <span className="m-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent)]" />
                Tijuana · 30 zonas activas
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="m-display mt-6"
            >
              Inteligencia
              <br />
              inmobiliaria,
              <br />
              <span className="text-[var(--m-gray-2)]">por zona.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="m-body-lg mt-6 max-w-[42ch]"
            >
              Precios por m², tendencias, riesgo y demografía INEGI cruzados con
              listings reales de Tijuana. Para brokers, desarrolladores e inversionistas.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-8 flex flex-wrap items-center gap-2"
            >
              <Link href="/login?mode=register" className="m-btn-primary">
                Crear cuenta gratis
              </Link>
              <Link href="/app" className="m-btn-ghost">
                Ver el dashboard
                <span aria-hidden>→</span>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-8 flex items-center gap-5 text-[12px] text-[var(--m-gray-2)]"
              style={{ letterSpacing: "0.02em" }}
            >
              <span>3 valuaciones gratis al mes</span>
              <span className="w-1 h-1 rounded-full bg-[var(--m-gray-3)]" />
              <span>Sin tarjeta</span>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="relative w-full"
          >
            <HeroPanel />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HeroPanel() {
  return (
    <div className="relative aspect-[5/4] sm:aspect-[5/5] lg:aspect-[5/6] w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto">
      <div
        className="absolute inset-0 rounded-[28px]"
        style={{
          background:
            "linear-gradient(160deg, rgba(16, 185, 129, 0.10) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%)",
        }}
      />

      <div className="m-glass absolute top-3 inset-x-3 sm:top-6 sm:left-0 sm:right-6 lg:right-12 p-5 md:p-6">
        <p className="m-eyebrow">Zona Centro · Venta · Residencial</p>
        <div className="flex items-end gap-3 mt-3">
          <p style={{ fontSize: "clamp(1.85rem, 4vw, 2.25rem)", lineHeight: "1", letterSpacing: "-0.03em" }}>
            $34,820
          </p>
          <p className="text-[14px] text-[var(--m-gray-1)] pb-1">/m²</p>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[13px] text-[var(--m-accent-ink)] font-medium">
            <span aria-hidden>↑</span> 4.2% últimos 90 días
          </span>
          <span className="text-[12px] text-[var(--m-gray-2)]">vs. mediana ciudad</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
          <div>
            <p className="text-[var(--m-gray-2)] uppercase tracking-wider" style={{ fontSize: "10px" }}>Inventario</p>
            <p className="text-[var(--m-ink)] mt-1" style={{ fontSize: "15px" }}>248</p>
          </div>
          <div>
            <p className="text-[var(--m-gray-2)] uppercase tracking-wider" style={{ fontSize: "10px" }}>Mediana</p>
            <p className="text-[var(--m-ink)] mt-1" style={{ fontSize: "15px" }}>$2.8M</p>
          </div>
          <div>
            <p className="text-[var(--m-gray-2)] uppercase tracking-wider" style={{ fontSize: "10px" }}>Riesgo</p>
            <p className="text-[var(--m-accent-ink)] mt-1" style={{ fontSize: "15px" }}>Bajo</p>
          </div>
        </div>
      </div>

      <div className="m-glass absolute bottom-3 inset-x-3 sm:bottom-2 sm:left-6 sm:right-0 lg:left-12 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="m-eyebrow" style={{ fontSize: "10px" }}>Precio/m² · 12 sem.</p>
          <p className="text-[10px] text-[var(--m-gray-2)] uppercase tracking-wider">Snapshots</p>
        </div>
        <Sparkline />
      </div>

      <div
        className="absolute -bottom-2 -right-2 w-24 h-24 rounded-full opacity-70 blur-2xl pointer-events-none"
        style={{ background: "rgba(16, 185, 129, 0.20)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -top-4 -left-4 w-32 h-32 rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{ background: "rgba(59, 130, 246, 0.18)" }}
        aria-hidden="true"
      />
    </div>
  )
}

function Sparkline() {
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
