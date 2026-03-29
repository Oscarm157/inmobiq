"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/icon"

const mobileNav = [
  { icon: "monitoring", label: "Precios", href: "/" },
  { icon: "explore", label: "Brújula", href: "/brujula" },
  { icon: "location_on", label: "Zonas", href: "/zonas" },
  { icon: "compare", label: "Comparar", href: "/comparar" },
  { icon: "search", label: "Buscar", href: "/buscar" },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    if (href === "/zonas") return pathname.startsWith("/zona")
    return pathname.startsWith(href.split("/").slice(0, 2).join("/"))
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 h-16 flex items-center justify-around z-50 px-2">
      {mobileNav.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 px-2 ${
            isActive(item.href) ? "text-slate-700 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <Icon name={item.icon} filled={isActive(item.href)} className="text-xl" />
          <span className="text-[9px] font-bold">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
