"use client"

import { useState, type ReactNode } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Icon } from "@/components/icon"

export type ZoneTab = "general" | "precios" | "composicion" | "zona"

const TABS: { id: ZoneTab; label: string; icon: string }[] = [
  { id: "general", label: "General", icon: "dashboard" },
  { id: "precios", label: "Precios", icon: "payments" },
  { id: "composicion", label: "Composición", icon: "donut_small" },
  { id: "zona", label: "Zona", icon: "location_on" },
]

interface ZoneTabsProps {
  defaultTab?: ZoneTab
  general: ReactNode
  precios: ReactNode
  composicion: ReactNode
  zona: ReactNode
}

export function ZoneTabs({ defaultTab = "general", general, precios, composicion, zona }: ZoneTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<ZoneTab>(
    (searchParams.get("tab") as ZoneTab) || defaultTab
  )

  const handleTabChange = (tab: ZoneTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "general") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const content: Record<ZoneTab, ReactNode> = { general, precios, composicion, zona }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div role="tablist" aria-label="Secciones de zona" className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Icon name={tab.icon} className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {content[activeTab]}
    </div>
  )
}
