"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"

export function SearchInput({ initialQuery = "" }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim().length >= 3) {
      router.push(`/buscar?q=${encodeURIComponent(value.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar zonas, colonias o desarrollos..."
        autoFocus
        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => { setValue(""); router.push("/buscar") }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <Icon name="close" className="text-lg" />
        </button>
      )}
    </form>
  )
}
