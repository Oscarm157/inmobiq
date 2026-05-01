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
    <nav className="m-nav" data-scrolled={scrolled}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-16 md:h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Inmobiq inicio">
          <Image
            src="/logo-inmobiq.png"
            alt="Inmobiq"
            width={120}
            height={28}
            className="h-6 md:h-7 w-auto"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] text-[var(--m-gray-1)] hover:text-[var(--m-ink)] transition-colors"
              style={{ letterSpacing: "-0.005em" }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="m-btn-ghost">Iniciar sesión</Link>
          <Link href="/login?mode=register" className="m-btn-primary text-[13px] py-2.5 px-5">
            Crear cuenta
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
  )
}
