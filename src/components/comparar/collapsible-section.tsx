"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon name={icon} className="text-base text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <Icon
          name="expand_more"
          className={`text-xl text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  )
}
