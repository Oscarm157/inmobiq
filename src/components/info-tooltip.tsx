"use client"

import { useState, useRef, useEffect } from "react"
import { Icon } from "@/components/icon"

interface InfoTooltipProps {
  content: string
  className?: string
}

export function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [open])

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-help"
        aria-label="Más información"
      >
        <Icon name="info" className="!text-[14px]" />
      </button>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64 px-3 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-[11px] leading-relaxed shadow-lg pointer-events-auto">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45" />
          {content}
        </div>
      )}
    </div>
  )
}
