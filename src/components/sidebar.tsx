"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@/components/icon"

const navItems = [
  { icon: "dashboard", label: "Market Overview", href: "/" },
  { icon: "location_on", label: "Zone Analytics", href: "/zona/zona-rio" },
  { icon: "query_stats", label: "Investment Risk", href: "#", disabled: true },
  { icon: "business_center", label: "Portfolio Explorer", href: "#", disabled: true },
  { icon: "architecture", label: "Development Pipeline", href: "#", disabled: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-slate-50/90 backdrop-blur-2xl hidden md:flex flex-col p-4 space-y-2">
      <div className="px-2 py-6 mb-4">
        <h1 className="text-lg font-bold text-blue-900">Inmobiq</h1>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Executive Terminal
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith("/zona")

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 rounded-xl cursor-not-allowed"
              >
                <Icon name={item.icon} />
                <span className="text-sm font-semibold">{item.label}</span>
              </span>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                isActive && !item.disabled
                  ? "flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 translate-x-1"
                  : "flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 rounded-xl"
              }
            >
              <Icon name={item.icon} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-slate-200 space-y-1">
        <button className="w-full bg-blue-700 text-white py-3 px-4 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all mb-4">
          Download Report
        </button>
        <a
          href="https://narrativa360.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors"
        >
          <Icon name="help_outline" />
          <span>Narrativa360</span>
        </a>
      </div>
    </aside>
  )
}
