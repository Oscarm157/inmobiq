"use client"

import { useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { setPreferredOperacion } from "@/lib/preference-cookies"

const MODES = [
  { value: "venta", label: "Compra / Venta", icon: "home" },
  { value: "renta", label: "Renta", icon: "key" },
] as const

interface ModeTabsProps {
  defaultMode?: string
}

export function ModeTabs({ defaultMode = "venta" }: ModeTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { collapsed } = useSidebar()
  const [isPending, startTransition] = useTransition()

  const rawOp = searchParams.get("operacion")
  const currentMode = rawOp === "renta" ? "renta" : rawOp === "venta" ? "venta" : defaultMode

  const handleSwitch = useCallback(
    (mode: string) => {
      if (mode === currentMode) return
      setPreferredOperacion(mode)

      const params = new URLSearchParams(searchParams.toString())
      params.set("operacion", mode)
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        router.refresh()
      })
    },
    [currentMode, searchParams, router, pathname, startTransition],
  )

  return (
    <div
      data-tour="mode-tabs"
      className={`fixed top-16 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-all ${
        collapsed ? "md:ml-16" : "md:ml-64"
      } ${isPending ? "opacity-80" : ""}`}
    >
      <div className="flex items-center gap-1 px-4 sm:px-8 max-w-7xl mx-auto h-11">
        {MODES.map(({ value, label, icon }) => {
          const active = currentMode === value
          return (
            <button
              key={value}
              onClick={() => handleSwitch(value)}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                active
                  ? "bg-slate-800 text-white shadow-md shadow-slate-500/25 dark:bg-blue-600 dark:shadow-blue-500/25 ring-1 ring-slate-700 dark:ring-blue-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon name={icon} className="text-sm" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
