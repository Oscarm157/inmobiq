"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { icon: "monitoring", label: "Precios", href: "/" },
  { icon: "explore", label: "Brújula", href: "/brujula" },
  { icon: "location_on", label: "Zonas", href: "/zonas" },
  { icon: "compare", label: "Comparar", href: "/comparar" },
  { icon: "query_stats", label: "Riesgo", href: "/riesgo" },
  { icon: "search", label: "Buscar", href: "/buscar" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useSidebar()
  const { user, isAdmin, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const userName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null

  const avatar = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    if (href === "/zonas") return pathname.startsWith("/zona")
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-50 bg-slate-50/90 dark:bg-[#0f0f1a]/90 backdrop-blur-2xl hidden md:flex flex-col p-4 space-y-2 border-r border-transparent dark:border-slate-800 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header + Toggle */}
      <div className={`flex items-center mb-4 ${collapsed ? "justify-center py-4" : "justify-between px-2 py-6"}`}>
        {!collapsed && (
          <div>
            <LogoTyping />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Panel de Análisis
            </p>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <Icon name={collapsed ? "menu" : "chevron_left"} className="text-xl" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={item.href === "/zona" ? "/zona/zona-rio" : item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
              } ${
                active
                  ? "bg-slate-700 text-white shadow-lg shadow-slate-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-blue-300 hover:bg-slate-50 dark:hover:bg-blue-950/50"
              }`}
            >
              <Icon name={item.icon} />
              {!collapsed && (
                <span className="text-sm font-semibold">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/admin/scraper"
            title={collapsed ? "Admin" : undefined}
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
              collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
            } ${
              isActive("/admin")
                ? "bg-slate-700 text-white shadow-lg shadow-slate-500/20"
                : "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}
          >
            <Icon name="admin_panel_settings" />
            {!collapsed && (
              <span className="text-sm font-semibold">Admin</span>
            )}
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        {collapsed ? (
          <button
            className="w-full flex justify-center py-3 text-slate-800 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
            title="Download Report"
          >
            <Icon name="download" />
          </button>
        ) : (
          <button className="w-full bg-slate-800 text-white py-3 px-4 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all mb-4">
            Download Report
          </button>
        )}
        <a
          href="https://narrativa360.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "Narrativa360" : undefined}
          className={`flex items-center gap-3 py-2 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-blue-400 transition-colors ${
            collapsed ? "justify-center" : "px-4"
          }`}
        >
          <Icon name="help_outline" />
          {!collapsed && <span>Narrativa360</span>}
        </a>

        {/* Auth section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
          {user ? (
            <>
              <Link
                href="/perfil"
                title={collapsed ? (userName ?? "Perfil") : undefined}
                className={`flex items-center gap-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  collapsed ? "justify-center" : "px-2"
                }`}
              >
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={userName ?? "Perfil"}
                    width={28}
                    height={28}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <Icon name="account_circle" className="text-slate-400 text-2xl flex-shrink-0" />
                )}
                {!collapsed && (
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                    {userName ?? user.email}
                  </span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                title={collapsed ? "Cerrar sesión" : undefined}
                className={`w-full flex items-center gap-3 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors ${
                  collapsed ? "justify-center" : "px-2"
                }`}
              >
                <Icon name="logout" className="text-base flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              title={collapsed ? "Iniciar sesión" : undefined}
              className={`flex items-center gap-3 py-2 text-slate-700 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors ${
                collapsed ? "justify-center" : "px-2"
              }`}
            >
              <Icon name="login" className="text-base flex-shrink-0" />
              {!collapsed && <span className="text-sm font-semibold">Iniciar sesión</span>}
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ── Animated logo wordmark ── */
const LOGO_TEXT = "INMOBIQ"

function getReplayDelay(_playCount: number): null {
  return null // play once, then stay static
}

export function LogoTyping() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [phase, setPhase] = useState<"typing" | "idle" | "done">("typing")
  const [playCount, setPlayCount] = useState(0)

  useEffect(() => {
    if (phase === "typing") {
      if (visibleCount < LOGO_TEXT.length) {
        const timer = setTimeout(() => setVisibleCount((c) => c + 1), 120)
        return () => clearTimeout(timer)
      }
      const newCount = playCount + 1
      setPlayCount(newCount)
      const delay = getReplayDelay(newCount)
      if (delay === null) {
        setPhase("done")
      } else {
        setPhase("idle")
      }
    }

    if (phase === "idle") {
      const delay = getReplayDelay(playCount)
      if (delay === null) {
        setPhase("done")
        return
      }
      const timer = setTimeout(() => {
        setVisibleCount(0)
        setPhase("typing")
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [visibleCount, phase, playCount])

  return (
    <h1
      className="text-2xl text-blue-900 dark:text-blue-300 tracking-wider"
      style={{ fontFamily: "'Bitcount Single', monospace" }}
    >
      {LOGO_TEXT.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block transition-opacity duration-300"
          style={{ opacity: i < visibleCount ? 1 : 0 }}
        >
          {char}
        </span>
      ))}
    </h1>
  )
}
