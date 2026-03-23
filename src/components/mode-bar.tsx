"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { useAuth } from "@/contexts/auth-context"
import {
  readCookieCategoria,
  readCookieOperacion,
  setPreferredCategoria,
  setPreferredOperacion,
} from "@/lib/preference-cookies"

type Categoria = "residencial" | "comercial" | "terreno"
type Operacion = "venta" | "renta"

const CAT_OPTIONS: { value: Categoria; label: string; icon: string }[] = [
  { value: "residencial", label: "Residencial", icon: "home" },
  { value: "comercial", label: "Comercial", icon: "storefront" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
]

const OP_OPTIONS: { value: Operacion; label: string }[] = [
  { value: "venta", label: "Compraventa" },
  { value: "renta", label: "Renta" },
]

export function ModeBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { collapsed } = useSidebar()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [categoria, setCategoria] = useState<Categoria>("residencial")
  const [operacion, setOperacion] = useState<Operacion>("venta")
  const [mounted, setMounted] = useState(false)

  // Hydrate from cookies on mount
  useEffect(() => {
    setCategoria(readCookieCategoria())
    setOperacion(readCookieOperacion())
    setMounted(true)
  }, [])

  const handleChange = useCallback(
    (cat: Categoria, op: Operacion) => {
      setCategoria(cat)
      setOperacion(op)
      setPreferredCategoria(cat)
      setPreferredOperacion(op)
      setOpen(false)

      // Persist to DB for logged-in users (fire-and-forget)
      if (user) {
        fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoria: cat, operacion: op }),
        }).catch(() => {})
      }

      // Strip conflicting URL params and refresh server components
      const url = new URL(window.location.href)
      url.searchParams.delete("operacion")
      url.searchParams.delete("categoria")
      const cleanPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "")
      router.replace(cleanPath)
    },
    [router, user],
  )

  const catInfo = CAT_OPTIONS.find((c) => c.value === categoria) ?? CAT_OPTIONS[0]
  const opInfo = OP_OPTIONS.find((o) => o.value === operacion) ?? OP_OPTIONS[0]

  // Don't render on login page
  if (pathname === "/login") return null

  return (
    <div
      className={`fixed top-16 right-0 left-0 z-30 ${
        collapsed ? "md:left-16" : "md:left-64"
      }`}
    >
      {/* Collapsed bar */}
      <div className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between py-2.5 group"
          >
            <div className="flex items-center gap-2">
              <Icon
                name={catInfo.icon}
                className="text-sm text-slate-500 dark:text-slate-400"
              />
              {mounted ? (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {catInfo.label}
                  <span className="text-slate-400 dark:text-slate-500 mx-1.5">·</span>
                  {opInfo.label}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Cargando...</span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              Cambiar
              <Icon
                name={open ? "expand_less" : "expand_more"}
                className="text-sm"
              />
            </span>
          </button>

          {/* Expanded selector */}
          {open && (
            <div className="pb-3 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              {/* Categoría */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 shrink-0">
                  Categoría
                </span>
                <div className="flex gap-1.5">
                  {CAT_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => handleChange(value, operacion)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        categoria === value
                          ? "bg-slate-800 text-white shadow-sm dark:bg-blue-600"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Icon name={icon} className="text-xs" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operación */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 shrink-0">
                  Operación
                </span>
                <div className="flex gap-1.5">
                  {OP_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleChange(categoria, value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        operacion === value
                          ? "bg-slate-800 text-white shadow-sm dark:bg-blue-600"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
