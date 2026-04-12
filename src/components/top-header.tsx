"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { GlobalSearch } from "@/components/global-search"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { openAuthModal } from "@/components/auth-modal"
import { CurrencySwitcher } from "@/components/currency-switcher"
import { LogoTyping } from "@/components/sidebar"

export function TopHeader() {
  const { collapsed } = useSidebar()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const { user, loading, signOut } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdowns on click outside
  useEffect(() => {
    if (!menuOpen && !moreMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen, moreMenuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    router.push("/")
  }

  // User display info
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const userEmail = user?.email || ""
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = userName
    ? userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-40 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(24,28,31,0.06)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.4)] h-16 flex justify-between items-center px-4 md:px-6 ${
          collapsed ? "md:left-16" : "md:left-64"
        }`}
      >
        {/* Desktop search */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <GlobalSearch />
        </div>

        {/* Mobile: animated brand label */}
        <div className="flex md:hidden items-center gap-2 flex-1">
          <LogoTyping />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile search trigger */}
          <button
            className="flex md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Abrir búsqueda"
          >
            <Icon name="search" />
          </button>

          {/* Desktop only: currency + theme */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencySwitcher />
            <button
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={toggleTheme}
              aria-label={resolvedTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} />
            </button>
            <Link
              href="/glosario"
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Glosario y ayuda"
              title="Glosario de términos"
            >
              <Icon name="help_outline" />
            </Link>
          </div>

          {/* Tour replay button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("inmobiq:replay-tour"))}
            className="hidden md:flex p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="Repetir tour guiado"
            title="Tour guiado"
          >
            <Icon name="rocket_launch" />
          </button>


          {/* User avatar + dropdown */}
          {!loading && (
            <div className="relative" ref={menuRef}>
              {user ? (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="h-9 w-9 rounded-full overflow-hidden border-2 border-slate-200 dark:border-blue-900 bg-blue-200 dark:bg-blue-900 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                  aria-label="Menú de usuario"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 dark:text-blue-300">{initials}</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal("login")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-full text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  <Icon name="login" className="text-sm" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                  <span className="sm:hidden">Entrar</span>
                </button>
              )}

              {/* Dropdown menu */}
              {menuOpen && user && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Icon name="person" className="text-base text-slate-400" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                    >
                      <Icon name="logout" className="text-base" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile overflow menu (⋮) */}
          <div className="relative md:hidden" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Más opciones"
            >
              <Icon name="more_vert" />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-50">
                {/* Theme toggle */}
                <button
                  onClick={() => { toggleTheme(); setMoreMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} className="text-base" />
                  {resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
                </button>

                {/* Currency switcher inline */}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <CurrencySwitcher inline />
                </div>
              </div>
            )}
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
