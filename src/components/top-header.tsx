"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { GlobalSearch } from "@/components/global-search"

export function TopHeader() {
  const { collapsed } = useSidebar()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-40 bg-white/80 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(24,28,31,0.06)] h-16 flex justify-between items-center px-4 md:px-6 transition-all duration-300 ${
          collapsed ? "md:left-16" : "md:left-64"
        }`}
      >
        {/* Desktop search */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <GlobalSearch />
        </div>

        {/* Mobile: brand label */}
        <div className="flex md:hidden items-center gap-2 flex-1">
          <span className="text-sm font-bold text-slate-700">Inmobiq</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile search trigger */}
          <button
            className="flex md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Abrir búsqueda"
          >
            <Icon name="search" />
          </button>

          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Icon name="notifications" />
          </button>
          <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
            <Icon name="settings" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-200 flex items-center justify-center">
            <Icon name="person" className="text-blue-700 text-sm" />
          </div>
        </div>
      </header>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 flex-shrink-0">
            <button
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
