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
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Sobre el hero (no scroll) = transparente + texto claro. Al scroll = sólida clara.
  const solid = scrolled || open
  const linkColor = solid ? "var(--m-gray-1)" : "rgba(255,255,255,0.82)"

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="transition-all duration-300"
        style={{
          background: solid ? "rgba(255,255,255,0.86)" : "transparent",
          backdropFilter: solid ? "blur(12px)" : "none",
          WebkitBackdropFilter: solid ? "blur(12px)" : "none",
          borderBottom: solid ? "1px solid var(--m-gray-4)" : "1px solid transparent",
          boxShadow: solid ? "var(--m-shadow-nav)" : "none",
        }}
      >
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 h-16 md:h-[76px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Inmobiq inicio">
            <Image
              src="/logo-inmobiq.png"
              alt="Inmobiq"
              width={120}
              height={28}
              className="h-6 md:h-7 w-auto transition-all duration-300"
              style={{ filter: solid ? "none" : "brightness(0) invert(1)" }}
              priority
            />
            <span
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full transition-colors"
              style={{
                background: solid ? "rgba(16, 185, 129, 0.08)" : "rgba(52,211,153,0.14)",
                color: solid ? "var(--m-accent-ink)" : "#6ee7b7",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
                border: solid ? "1px solid rgba(16, 185, 129, 0.18)" : "1px solid rgba(52,211,153,0.3)",
              }}
            >
              Beta
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 relative" onMouseLeave={() => setHovered(null)}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHovered(l.href)}
                className="relative px-3.5 py-2 text-[14px] transition-colors z-10"
                style={{ color: hovered === l.href ? (solid ? "var(--m-ink)" : "#ffffff") : linkColor, letterSpacing: "-0.005em" }}
              >
                {hovered === l.href && (
                  <motion.span
                    layoutId="m-nav-pill"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      background: solid ? "var(--m-canvas-soft)" : "rgba(255,255,255,0.1)",
                      border: solid ? "1px solid var(--m-gray-4)" : "1px solid rgba(255,255,255,0.14)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] transition-colors"
              style={{ color: linkColor, letterSpacing: "-0.005em" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login?mode=register"
              className={solid ? "m-btn-primary text-[13px] py-2.5 px-5" : "m-btn-light text-[13px] py-2.5 px-5"}
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
            <span className={`block h-px w-5 transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} style={{ background: solid ? "var(--m-ink)" : "#fff" }} />
            <span className={`block h-px w-5 transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} style={{ background: solid ? "var(--m-ink)" : "#fff" }} />
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
