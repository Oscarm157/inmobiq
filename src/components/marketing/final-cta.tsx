"use client"

import Link from "next/link"
import { motion } from "motion/react"

export function FinalCTA() {
  return (
    <section className="bg-[var(--m-canvas)]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-[28px] overflow-hidden bg-[var(--m-ink)] text-[var(--m-canvas)] px-6 md:px-16 py-16 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 85% 25%, rgba(16,185,129,0.18) 0%, transparent 60%), radial-gradient(ellipse 45% 55% at 5% 85%, rgba(59,130,246,0.16) 0%, transparent 60%), radial-gradient(ellipse 35% 40% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 65%)",
            }}
          />
          <div className="relative max-w-[28ch]">
            <p className="m-eyebrow text-[var(--m-gray-3)]">Empieza hoy</p>
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
            <p className="mt-5 text-[var(--m-gray-3)] text-[16px] leading-relaxed max-w-[42ch]">
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
        </motion.div>
      </div>
    </section>
  )
}
