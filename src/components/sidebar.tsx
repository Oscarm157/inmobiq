"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@/components/icon"
import { useSidebar } from "@/components/sidebar-provider"

const navItems = [
  { icon: "dashboard", label: "Market Overview", href: "/" },
  { icon: "location_on", label: "Zone Analytics", href: "/zona" },
  { icon: "query_stats", label: "Investment Risk", href: "/riesgo" },
  { icon: "business_center", label: "Portfolio Explorer", href: "/portafolio" },
  { icon: "architecture", label: "Development Pipeline", href: "/pipeline" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-50 bg-slate-50/90 backdrop-blur-2xl hidden md:flex flex-col p-4 space-y-2 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header + Toggle */}
      <div className={`flex items-center mb-4 ${collapsed ? "justify-center py-4" : "justify-between px-2 py-6"}`}>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-blue-900">Inmobiq</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Executive Terminal
            </p>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
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
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
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

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 space-y-1">
        {collapsed ? (
          <button
            className="w-full flex justify-center py-3 text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
            title="Download Report"
          >
            <Icon name="download" />
          </button>
        ) : (
          <button className="w-full bg-blue-700 text-white py-3 px-4 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all mb-4">
            Download Report
          </button>
        )}
        <a
          href="https://narrativa360.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "Narrativa360" : undefined}
          className={`flex items-center gap-3 py-2 text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors ${
            collapsed ? "justify-center" : "px-4"
          }`}
        >
          <Icon name="help_outline" />
          {!collapsed && <span>Narrativa360</span>}
        </a>
      </div>
    </aside>
  )
}
