"use client"

import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

/**
 * Global sticky banner at the bottom of the screen — dark theme.
 * Appears when any [data-auth-gated] element is visible in the viewport.
 * Hidden for authenticated users.
 *
 * Attention animation:
 * - 3 times at 5s intervals (5s, 10s, 15s)
 * - then 3 times at 30s intervals (45s, 75s, 105s)
 * - then stays static forever
 */

const ATTENTION_TIMES = [5000, 10000, 15000, 45000, 75000, 105000]

export function AuthBanner() {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [attention, setAttention] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (user || loading) return

    const gated = document.querySelectorAll("[data-auth-gated]")
    if (gated.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting)
        if (anyVisible) {
          setVisible(true)
        } else {
          const stillVisible = Array.from(gated).some((el) => {
            const rect = el.getBoundingClientRect()
            return rect.top < window.innerHeight && rect.bottom > 0
          })
          setVisible(stillVisible)
        }
      },
      { threshold: 0 }
    )

    gated.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [user, loading])

  // Attention animation schedule
  useEffect(() => {
    if (!visible || user) return

    timersRef.current = ATTENTION_TIMES.map((ms) =>
      setTimeout(() => {
        setAttention(true)
        setTimeout(() => setAttention(false), 1500)
      }, ms)
    )

    return () => timersRef.current.forEach(clearTimeout)
  }, [visible, user])

  if (loading || user || !visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className={`bg-slate-900 shadow-[0_-4px_30px_rgba(0,0,0,0.3)] transition-all duration-500 ${attention ? "auth-banner-attention" : ""}`}>
        {/* Animated shine sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {attention && (
            <div className="auth-banner-shine absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]" />
          )}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 transition-all duration-500 ${attention ? "scale-110 bg-blue-500/30" : ""}`}>
              <Icon name="lock_open" className="text-base text-blue-400" />
            </div>
            <p className="text-sm text-slate-400 truncate">
              <span className="font-semibold text-white">Regístrate gratis</span>
              {" "}para acceder a toda la inteligencia de mercado
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block"
            >
              Ya tengo cuenta
            </Link>
            <Link
              href="/login"
              className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 ${attention ? "scale-105 shadow-blue-500/40" : ""}`}
            >
              <Icon name="person_add" className="text-sm" />
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
