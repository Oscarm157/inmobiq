"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"

const links = [
  { label: "Producto", href: "#producto" },
  { label: "Datos", href: "#datos" },
  { label: "Precios", href: "#precios" },
  { label: "Preguntas", href: "#faq" },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <div className="sticky top-0 z-40">
      {/* Status strip */}
      <div
        className="hidden md:block w-full"
        style={{
          background: "linear-gradient(90deg, #0b1326 0%, #0f172a 100%)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-8 h-8 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2.5" style={{ color: "#cbd5e1", letterSpacing: "0.04em" }}>
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
            <span>Datos en vivo · Tijuana, B.C.</span>
            <span style={{ color: "#475569" }}>·</span>
            <span style={{ color: "#94a3b8" }}>30 zonas activas · actualización semanal</span>
          </div>
          <div className="flex items-center gap-4" style={{ color: "#94a3b8" }}>
            <a
              href="mailto:oscar.amayoral@gmail.com"
              className="hover:text-white transition-colors"
              style={{ letterSpacing: "0.02em" }}
            >
              Contacto
            </a>
            <span style={{ color: "#475569" }}>·</span>
            <Link
              href="/login"
              className="hover:text-white transition-colors"
              style={{ letterSpacing: "0.02em" }}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="m-nav" data-scrolled={scrolled}>
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-16 md:h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Inmobiq inicio">
            <Image
              src="/logo-inmobiq.png"
              alt="Inmobiq"
              width={120}
              height={28}
              className="h-6 md:h-7 w-auto"
              priority
            />
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                color: "var(--m-accent-ink)",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
                border: "1px solid rgba(16, 185, 129, 0.18)",
              }}
            >
              Beta
            </span>
          </Link>

          {/* Center pills */}
          <div
            className="hidden md:flex items-center gap-1 relative"
            onMouseLeave={() => setHovered(null)}
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHovered(l.href)}
                className="relative px-3.5 py-2 text-[14px] transition-colors z-10"
                style={{
                  color: hovered === l.href ? "var(--m-ink)" : "var(--m-gray-1)",
                  letterSpacing: "-0.005em",
                }}
              >
                {hovered === l.href && (
                  <motion.span
                    layoutId="m-nav-pill"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: "var(--m-canvas-soft)", border: "1px solid var(--m-gray-4)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/app"
              className="text-[13px] transition-colors"
              style={{
                color: "var(--m-gray-1)",
                letterSpacing: "-0.005em",
              }}
            >
              Demo
            </Link>
            <span style={{ width: 1, height: 18, background: "var(--m-gray-4)" }} />
            <Link
              href="/login?mode=register"
              className="m-btn-primary text-[13px] py-2.5 px-5"
            >
              Crear cuenta
              <span aria-hidden style={{ marginLeft: 2 }}>→</span>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`block h-px w-5 bg-[var(--m-ink)] transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[var(--m-ink)] transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="md:hidden absolute left-0 right-0 top-16 bg-[var(--m-canvas)] border-b border-[var(--m-gray-4)]"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                <div
                  className="flex items-center gap-2 px-1 py-2 mb-2 text-[11px]"
                  style={{ color: "var(--m-gray-1)", letterSpacing: "0.04em" }}
                >
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
                  Datos en vivo · 30 zonas en Tijuana
                </div>
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="py-3 text-[18px] text-[var(--m-ink)]"
                    style={{ letterSpacing: "-0.015em" }}
                  >
                    {l.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-[var(--m-gray-4)] mt-2">
                  <Link href="/login" onClick={() => setOpen(false)} className="m-btn-ghost justify-start">
                    Iniciar sesión
                  </Link>
                  <Link href="/login?mode=register" onClick={() => setOpen(false)} className="m-btn-primary w-full justify-center">
                    Crear cuenta
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  )
}
