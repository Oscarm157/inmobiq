"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { GlobalSearch } from "@/components/global-search"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { getActiveAlertCount } from "@/lib/data/alerts"

export function TopHeader() {
  const { collapsed } = useSidebar()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setAlertCount(0)
      return
    }
    getActiveAlertCount(user.id)
      .then(setAlertCount)
      .catch(() => {})
  }, [user])

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-40 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(24,28,31,0.06)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.4)] h-16 flex justify-between items-center px-4 md:px-6 transition-all duration-300 ${
          collapsed ? "md:left-16" : "md:left-64"
        }`}
      >
        {/* Desktop search */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <GlobalSearch />
        </div>

        {/* Mobile: brand label */}
        <div className="flex md:hidden items-center gap-2 flex-1">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Inmobiq</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile search trigger */}
          <button
            className="flex md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Abrir búsqueda"
          >
            <Icon name="search" />
          </button>

          {/* Dark mode toggle */}
          <button
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={toggleTheme}
            aria-label={resolvedTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} />
          </button>

          <Link
            href="/alertas"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Mis alertas"
          >
            <Icon name="notifications" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
          <button className="hidden md:flex p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
            <Icon name="settings" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-100 dark:border-blue-900 bg-blue-200 dark:bg-blue-900 flex items-center justify-center">
            <Icon name="person" className="text-blue-700 dark:text-blue-300 text-sm" />
          </div>
        </div>
      </header>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#0f0f1a] flex flex-col md:hidden">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <button
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Cerrar búsqueda"
            >
              <Icon name="arrow_back" />
            </button>
            <div className="flex-1">
              <GlobalSearch
                mobileMode
                onClose={() => setMobileSearchOpen(false)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" />
        </div>
      )}
    </>
  )
}
