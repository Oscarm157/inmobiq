"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/icon"

const mobileNav = [
  { icon: "dashboard", label: "Overview", href: "/" },
  { icon: "location_on", label: "Analytics", href: "/zona/zona-rio" },
  { icon: "query_stats", label: "Risk", href: "#" },
  { icon: "business_center", label: "Portfolio", href: "#" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 h-16 flex items-center justify-around z-50 px-4">
      {mobileNav.map((item, i) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith("/zona")

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              isActive ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <Icon name={item.icon} filled={isActive} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
