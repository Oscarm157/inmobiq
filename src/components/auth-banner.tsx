"use client"

import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Global sticky banner at the bottom of the screen.
 * Appears when any [data-auth-gated] element is visible in the viewport.
 * Hidden for authenticated users.
 */
export function AuthBanner() {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)

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
          // Only hide if NO gated elements are intersecting
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

  if (loading || user || !visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background/90 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center shrink-0">
              <Icon name="lock" className="text-base text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-semibold text-foreground">Regístrate gratis</span>
              {" "}para acceder a toda la inteligencia de mercado
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Ya tengo cuenta
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
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
