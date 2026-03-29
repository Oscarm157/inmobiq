"use client"

import { useState, type ReactNode } from "react"
import { Icon } from "@/components/icon"

interface CollapsibleSectionProps {
  title: string
  icon: string
  iconColor?: string
  iconBg?: string
  preview?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  icon,
  iconColor = "text-slate-600",
  iconBg = "bg-slate-50 dark:bg-slate-800",
  preview,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
            <Icon name={icon} className="text-xl" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {preview && !open && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{preview}</p>
            )}
          </div>
        </div>
        <Icon
          name={open ? "expand_more" : "chevron_right"}
          className="text-slate-400 dark:text-slate-500 transition-transform"
        />
      </button>
      {open && (
        <div className="px-6 pb-8">
          {children}
        </div>
      )}
    </div>
  )
}
