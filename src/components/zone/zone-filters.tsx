"use client"

import { useCallback, useRef, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { setPreferredCategoria, setPreferredOperacion } from "@/lib/preference-cookies"

type Categoria = "residencial" | "comercial" | "terreno" | ""
type Operacion = "venta" | "renta" | ""

const CAT_OPTIONS: { value: Categoria; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "terreno", label: "Terreno" },
  { value: "", label: "Todas" },
]

const OP_OPTIONS: { value: Operacion; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "renta", label: "Renta" },
  { value: "", label: "Todas" },
]

interface ZoneFiltersProps {
  defaultOperacion?: string
  defaultCategoria?: string
}

export function ZoneFilters({ defaultOperacion = "venta", defaultCategoria = "residencial" }: ZoneFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const isLocalUpdate = useRef(false)

  const rawCat = searchParams.get("categoria")
  const rawOp = searchParams.get("operacion")
  const currentCat = (rawCat === "todas" ? "" : rawCat ?? defaultCategoria) as Categoria
  const currentOp = (rawOp === "todas" ? "" : rawOp ?? defaultOperacion) as Operacion

  const pushParams = useCallback(
    (op: Operacion | null, cat: Categoria | null) => {
      const nextOp = op !== null ? op : currentOp
      const nextCat = cat !== null ? cat : currentCat

      if (nextCat) setPreferredCategoria(nextCat)
      if (nextOp) setPreferredOperacion(nextOp)

      const p = new URLSearchParams(searchParams.toString())

      // Operación
      if (nextOp && nextOp !== "venta") p.set("operacion", nextOp)
      else if (!nextOp) p.set("operacion", "todas")
      else p.delete("operacion")

      // Categoría
      if (nextCat && nextCat !== "residencial") p.set("categoria", nextCat)
      else if (!nextCat) p.set("categoria", "todas")
      else p.delete("categoria")

      const qs = p.toString()
      isLocalUpdate.current = true
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [router, pathname, searchParams, startTransition, currentOp, currentCat],
  )

  const btnClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
      active
        ? "bg-slate-800 text-white shadow-sm dark:bg-blue-600"
        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
    }`

  return (
    <div className={`flex flex-wrap items-center gap-4 transition-opacity ${isPending ? "opacity-70" : ""}`}>
      {/* Operación */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación</span>
        <div className="flex gap-1">
          {OP_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => pushParams(value, null)} className={btnClass(currentOp === value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Categoría */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</span>
        <div className="flex gap-1">
          {CAT_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => pushParams(null, value)} className={btnClass(currentCat === value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
