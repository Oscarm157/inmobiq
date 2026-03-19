"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/icon"

const mobileNav = [
  { icon: "dashboard", label: "Overview", href: "/" },
  { icon: "location_on", label: "Zonas", href: "/zona/zona-rio" },
  { icon: "query_stats", label: "Riesgo", href: "/riesgo" },
  { icon: "business_center", label: "Portfolio", href: "/portafolio" },
  { icon: "architecture", label: "Pipeline", href: "/pipeline" },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href.split("/").slice(0, 2).join("/"))
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 h-16 flex items-center justify-around z-50 px-2">
      {mobileNav.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 px-2 ${
            isActive(item.href) ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <Icon name={item.icon} filled={isActive(item.href)} className="text-xl" />
          <span className="text-[9px] font-bold">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
