"use client"

import Link from "next/link"
import { motion } from "motion/react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
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
            "radial-gradient(ellipse 55% 45% at 50% -5%, rgba(16, 185, 129, 0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 8%, rgba(59, 130, 246, 0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative max-w-[1180px] mx-auto px-5 md:px-8 pt-16 md:pt-28 pb-14 md:pb-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
            <span className="m-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent)]" />
              Tijuana · 30 zonas · datos públicos
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="m-display mt-7 max-w-[16ch]"
          >
            El mercado inmobiliario de Tijuana,{" "}
            <span className="text-[var(--m-gray-3)]">por zona.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="m-body-lg mt-7 max-w-[54ch]"
          >
            Precios por m², tendencias, riesgo y demografía del Censo INEGI en 30 zonas.
            Información pública del mercado, ordenada para quien compra, renta, invierte o desarrolla.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-9 flex flex-wrap items-center justify-center gap-2"
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
            className="mt-6 flex items-center gap-4 text-[12px] text-[var(--m-gray-2)]"
            style={{ letterSpacing: "0.02em" }}
          >
            <span>3 valuaciones gratis al mes</span>
            <span className="w-1 h-1 rounded-full bg-[var(--m-gray-3)]" />
            <span>Sin tarjeta</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
          className="mt-16 md:mt-20"
        >
          <HeroShowcase />
        </motion.div>
      </div>
    </section>
  )
}

/* Showcase: panel abstracto minimalista con cards glass flotantes de datos reales */
function HeroShowcase() {
  return (
    <div className="relative mx-auto max-w-[980px]">
      <div
        className="relative rounded-[28px] overflow-hidden border border-[var(--m-gray-4)]"
        style={{
          aspectRatio: "16 / 9",
          background:
            "linear-gradient(150deg, rgba(16, 185, 129, 0.14) 0%, rgba(59, 130, 246, 0.10) 45%, rgba(255,255,255,0) 78%), #ffffff",
        }}
      >
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.55]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 80%)",
          }}
        />

        {/* Formas abstractas suaves */}
        <div
          className="absolute -top-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-70 pointer-events-none"
          style={{ background: "rgba(16, 185, 129, 0.22)" }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 right-4 w-72 h-72 rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{ background: "rgba(59, 130, 246, 0.18)" }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46%] aspect-square rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(16,185,129,0.25)" }}
          aria-hidden="true"
        />

        {/* Card KPI principal */}
        <div className="m-glass absolute top-[10%] left-[6%] w-[58%] max-w-[380px] p-5 md:p-6">
          <p className="m-eyebrow" style={{ fontSize: "10px" }}>Zona Centro · Venta · Residencial</p>
          <div className="flex items-end gap-3 mt-3">
            <p style={{ fontSize: "clamp(1.9rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.03em", fontWeight: 500 }}>
              $34,820
            </p>
            <p className="text-[14px] text-[var(--m-gray-1)] pb-1">/m²</p>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[13px] text-[var(--m-accent-ink)]" style={{ fontWeight: 500 }}>
              <span aria-hidden>↑</span> 4.2% últimos 90 días
            </span>
            <span className="text-[12px] text-[var(--m-gray-2)]">vs. mediana ciudad</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Kpi label="Inventario" value="248" />
            <Kpi label="Mediana" value="$2.8M" />
            <Kpi label="Riesgo" value="Bajo" accent />
          </div>
        </div>

        {/* Card sparkline flotante */}
        <div className="m-glass absolute bottom-[9%] right-[6%] w-[52%] max-w-[320px] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="m-eyebrow" style={{ fontSize: "10px" }}>Precio/m² · 12 sem.</p>
            <p className="text-[10px] text-[var(--m-gray-2)] uppercase tracking-wider">Snapshots</p>
          </div>
          <Sparkline />
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[var(--m-gray-2)] uppercase tracking-wider" style={{ fontSize: "10px" }}>{label}</p>
      <p className="mt-1" style={{ fontSize: "15px", color: accent ? "var(--m-accent-ink)" : "var(--m-ink)" }}>{value}</p>
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
