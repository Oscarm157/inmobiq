"use client"

import { useCallback, useRef, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { setPreferredCategoria } from "@/lib/preference-cookies"

type Categoria = "residencial" | "comercial" | "terreno" | ""

const CAT_OPTIONS: { value: Categoria; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "terreno", label: "Terreno" },
  { value: "", label: "Todas" },
]

interface ZoneFiltersProps {
  defaultOperacion?: string
  defaultCategoria?: string
}

export function ZoneFilters({ defaultCategoria = "residencial" }: ZoneFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const isLocalUpdate = useRef(false)

  const rawCat = searchParams.get("categoria")
  const currentCat = (rawCat === "todas" ? "" : rawCat ?? defaultCategoria) as Categoria

  const pushParams = useCallback(
    (cat: Categoria) => {
      if (cat) setPreferredCategoria(cat)

      const p = new URLSearchParams(searchParams.toString())
      if (cat && cat !== "residencial") p.set("categoria", cat)
      else if (!cat) p.set("categoria", "todas")
      else p.delete("categoria")
      const qs = p.toString()
      isLocalUpdate.current = true
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        router.refresh()
      })
    },
    [router, pathname, searchParams, startTransition],
  )

  return (
    <div className={`flex flex-wrap items-center gap-4 transition-opacity ${isPending ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</span>
        <div className="flex gap-1">
          {CAT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => pushParams(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentCat === value
                  ? "bg-slate-800 text-white shadow-sm dark:bg-blue-600"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
