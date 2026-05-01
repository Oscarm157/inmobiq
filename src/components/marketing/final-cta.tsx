"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Sparkline } from "./hero"

export function FinalCTA() {
  return (
    <section className="bg-[var(--m-canvas)]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-[28px] overflow-hidden text-[var(--m-canvas)] px-6 md:px-16 py-16 md:py-24"
          style={{
            background:
              "linear-gradient(165deg, #0b1326 0%, #0f172a 55%, #0b1326 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 85% 25%, rgba(16,185,129,0.20) 0%, transparent 60%), radial-gradient(ellipse 45% 55% at 5% 85%, rgba(59,130,246,0.18) 0%, transparent 60%), radial-gradient(ellipse 35% 40% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)",
            }}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-[28ch]">
              <p className="m-eyebrow" style={{ color: "#94a3b8" }}>
                Empieza hoy
              </p>
              <h2
                className="mt-5"
                style={{
                  fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                  lineHeight: "0.96",
                  letterSpacing: "-0.032em",
                  color: "var(--m-canvas)",
                }}
              >
                Mercado inmobiliario de Tijuana, leído por zona.
              </h2>
              <p
                className="mt-5 text-[16px] leading-relaxed max-w-[42ch]"
                style={{ color: "#cbd5e1" }}
              >
                Crea cuenta gratis con tres valuaciones al mes. Sin tarjeta.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?mode=register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--m-canvas)] text-[var(--m-ink)] text-[15px] font-medium hover:translate-y-[-1px] transition-transform"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Crear cuenta gratis
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-transparent text-[var(--m-canvas)] text-[15px] font-medium border border-white/20 hover:bg-white/[0.06] transition-colors"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Explorar el dashboard
                </Link>
              </div>
            </div>

            <FinalKPIPanel />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FinalKPIPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      className="relative w-full max-w-[460px] mx-auto lg:ml-auto"
    >
      <div
        className="rounded-[20px] p-6"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="flex items-center justify-between">
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Hipódromo · Venta · Residencial
          </p>
          <span className="relative flex w-1.5 h-1.5">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(16,185,129,0.6)" }}
            />
            <span
              className="relative inline-flex w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981" }}
            />
          </span>
        </div>

        <div className="flex items-end gap-3 mt-4">
          <p
            style={{
              fontSize: "clamp(2rem, 3.5vw, 2.5rem)",
              lineHeight: "1",
              letterSpacing: "-0.03em",
              color: "var(--m-canvas)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            $42,150
          </p>
          <p style={{ fontSize: "14px", color: "#94a3b8", paddingBottom: "4px" }}>/m²</p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center gap-1 font-medium"
            style={{ fontSize: "13px", color: "#34d399" }}
          >
            <span aria-hidden>↑</span> 6.1% últimos 90 días
          </span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>vs. mediana ciudad</span>
        </div>

        <div
          className="mt-5 grid grid-cols-3 gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}
        >
          <div>
            <p style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Inventario
            </p>
            <p style={{ fontSize: "15px", color: "var(--m-canvas)", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              312
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Mediana
            </p>
            <p style={{ fontSize: "15px", color: "var(--m-canvas)", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              $4.1M
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Riesgo
            </p>
            <p style={{ fontSize: "15px", color: "#34d399", marginTop: "4px" }}>Bajo</p>
          </div>
        </div>

        <div
          className="mt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Precio/m² · 12 sem.
            </p>
            <p style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Snapshots
            </p>
          </div>
          <Sparkline />
        </div>
      </div>
    </motion.div>
  )
}
