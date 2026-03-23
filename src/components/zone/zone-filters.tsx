"use client"

import { useCallback, useRef, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

type Operacion = "venta" | "renta" | ""
type Categoria = "residencial" | "comercial" | "terreno" | ""

const OP_OPTIONS: { value: Operacion; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "renta", label: "Renta" },
  { value: "", label: "Todas" },
]

const CAT_OPTIONS: { value: Categoria; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "terreno", label: "Terreno" },
  { value: "", label: "Todas" },
]

export function ZoneFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const isLocalUpdate = useRef(false)

  // Read current values from URL (defaults applied by the server component)
  const currentOp = (searchParams.get("operacion") ?? "venta") as Operacion
  const currentCat = (searchParams.get("categoria") ?? "residencial") as Categoria

  const pushParams = useCallback(
    (op: Operacion, cat: Categoria) => {
      const p = new URLSearchParams()
      // Only add params that differ from the default (venta+residencial)
      if (op && op !== "venta") p.set("operacion", op)
      if (!op) p.set("operacion", "todas")
      if (cat && cat !== "residencial") p.set("categoria", cat)
      if (!cat) p.set("categoria", "todas")
      const qs = p.toString()
      isLocalUpdate.current = true
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [router, pathname, startTransition],
  )

  return (
    <div className={`flex flex-wrap items-center gap-4 transition-opacity ${isPending ? "opacity-70" : ""}`}>
      {/* Operación */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación</span>
        <div className="flex gap-1">
          {OP_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => pushParams(value, currentCat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentOp === value
                  ? "bg-slate-800 text-white shadow-sm dark:bg-blue-600"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
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
            <button
              key={value}
              onClick={() => pushParams(currentOp, value)}
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
