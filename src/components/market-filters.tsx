"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import {
  PROPERTY_TYPES,
  PUBLIC_ZONES,
  ZONES,
  BEDROOMS,
  buildMarketParams,
  parseMarketParams,
  hasActiveFilters,
  countActiveFilters,
  type MarketFilterState,
} from "@/lib/filter-utils"
import { setPreferredCategoria, setPreferredOperacion } from "@/lib/preference-cookies"

// Re-export for consumers that imported from this file
export { buildMarketParams, parseMarketParams, type MarketFilterState } from "@/lib/filter-utils"

/** Prevent scroll-wheel from changing number inputs */
function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur()
}

interface MarketFiltersProps {
  defaultOperacion?: string
  defaultCategoria?: string
}

export function MarketFilters({ defaultOperacion = "", defaultCategoria = "" }: MarketFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [state, setState] = useState<MarketFilterState>(() => {
    const parsed = parseMarketParams(searchParams)
    return {
      ...parsed,
      listing_type: parsed.listing_type || (defaultOperacion as MarketFilterState["listing_type"]),
      categoria: parsed.categoria || (defaultCategoria as MarketFilterState["categoria"]),
    }
  })
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const isLocalUpdate = useRef(false)
  const { formatPrice, currency } = useCurrency()

  // Sync from URL on external navigation only (not our own pushes)
  useEffect(() => {
    if (isLocalUpdate.current) {
      isLocalUpdate.current = false
      return
    }
    const parsed = parseMarketParams(searchParams)
    setState({
      ...parsed,
      listing_type: parsed.listing_type || (defaultOperacion as MarketFilterState["listing_type"]),
      categoria: parsed.categoria || (defaultCategoria as MarketFilterState["categoria"]),
    })
  }, [searchParams, defaultOperacion, defaultCategoria])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Close panel on Escape key or click outside
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", handleEsc)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const pushFilters = useCallback(
    (next: MarketFilterState, delay = 400) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        isLocalUpdate.current = true
        const params = buildMarketParams(next)
        const qs = params.toString()
        startTransition(() => {
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        })
      }, delay)
    },
    [router, pathname, startTransition]
  )

  const handleChange = (next: MarketFilterState) => {
    setState(next)
    // Persist category/operation preference in cookie
    if (next.categoria) setPreferredCategoria(next.categoria)
    if (next.listing_type) setPreferredOperacion(next.listing_type)
    pushFilters(next)
  }

  const handleInputChange = (next: MarketFilterState) => {
    setState(next)
    pushFilters(next, 600) // Longer debounce for text inputs
  }

  const handleClear = () => {
    const defaults: MarketFilterState = {
      tipos: [], zonas: [],
      listing_type: defaultOperacion as MarketFilterState["listing_type"],
      categoria: defaultCategoria as MarketFilterState["categoria"],
      precio_min: "", precio_max: "",
      area_min: "", area_max: "",
      recamaras: [],
    }
    setState(defaults)
    isLocalUpdate.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Clear URL params — server will re-apply cookie defaults
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const activeCount = countActiveFilters(state, { listing_type: defaultOperacion, categoria: defaultCategoria })

  return (
    <div ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-6 py-3 border rounded-full text-sm font-bold shadow-sm transition-all ${
          open || activeCount > 0
            ? "bg-slate-800 text-white border-blue-700"
            : "bg-white text-slate-800 border-white hover:bg-slate-100 shadow-lg shadow-white/10"
        }`}
      >
        <Icon name="filter_list" className="text-sm" />
        Filtros
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-white text-slate-800">
            {activeCount}
          </span>
        )}
        <Icon name={open ? "expand_less" : "expand_more"} className="text-sm" />
      </button>

      {/* Full-width panel — positioned absolutely below button */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-3">
          <div className={`bg-white dark:bg-slate-900 border border-blue-500/40 dark:border-blue-500/30 rounded-2xl shadow-xl shadow-blue-500/10 transition-opacity duration-150 overflow-hidden ${isPending ? "opacity-90" : "opacity-100"}`}>

            {/* ── Main content: left filters + right zones ── */}
            <div className="flex divide-x divide-slate-100 dark:divide-slate-800">

              {/* Left: all controls stacked */}
              <div className="flex-1 p-5 space-y-5">

                {/* Categoría */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Categoría</p>
                  <div className="flex gap-2">
                    {([
                      { value: "" as const, label: "Todas" },
                      { value: "residencial" as const, label: "Residencial" },
                      { value: "comercial" as const, label: "Comercial" },
                      { value: "terreno" as const, label: "Terreno" },
                    ]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleChange({ ...state, categoria: value })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                          state.categoria === value
                            ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de propiedad */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Tipo de Propiedad</p>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map(({ value, label, icon }) => {
                      const active = state.tipos.includes(value)
                      return (
                        <button
                          key={value}
                          onClick={() => handleChange({ ...state, tipos: toggle(state.tipos, value) })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            active
                              ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <Icon name={icon} className="text-xs" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Recámaras */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Recámaras</p>
                  <div className="flex gap-2">
                    {BEDROOMS.map((r) => {
                      const active = state.recamaras.includes(r)
                      return (
                        <button
                          key={r}
                          onClick={() => handleChange({ ...state, recamaras: toggle(state.recamaras, r) })}
                          className={`w-10 py-2 rounded-lg text-xs font-bold transition-colors ${
                            active
                              ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {r === 4 ? "4+" : r}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Precio + Superficie */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Precio */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Precio ({currency})</p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="Mín"
                        aria-label="Precio mínimo"
                        value={state.precio_min}
                        onChange={(e) => handleInputChange({ ...state, precio_min: e.target.value })}
                        onWheel={preventScrollChange}
                        className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 dark:text-slate-600 text-sm font-light shrink-0">—</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Máx"
                        aria-label="Precio máximo"
                        value={state.precio_max}
                        onChange={(e) => handleInputChange({ ...state, precio_max: e.target.value })}
                        onWheel={preventScrollChange}
                        className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {state.precio_min && state.precio_max && Number(state.precio_min) > Number(state.precio_max) && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">Mínimo mayor que máximo</p>
                    )}
                  </div>

                  {/* Superficie */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Superficie (m²)</p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="Mín"
                        aria-label="Superficie mínima"
                        value={state.area_min}
                        onChange={(e) => handleInputChange({ ...state, area_min: e.target.value })}
                        onWheel={preventScrollChange}
                        className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 dark:text-slate-600 text-sm font-light shrink-0">—</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Máx"
                        aria-label="Superficie máxima"
                        value={state.area_max}
                        onChange={(e) => handleInputChange({ ...state, area_max: e.target.value })}
                        onWheel={preventScrollChange}
                        className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {state.area_min && state.area_max && Number(state.area_min) > Number(state.area_max) && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">Mínimo mayor que máximo</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: zones scrollable */}
              <div className="w-80 lg:w-96 p-5 shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Zona</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {PUBLIC_ZONES.map(({ slug, name }) => {
                    const active = state.zonas.includes(slug)
                    return (
                      <label key={slug} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleChange({ ...state, zonas: toggle(state.zonas, slug) })}
                          className="w-3.5 h-3.5 rounded accent-blue-600 shrink-0"
                        />
                        <span className={`text-xs truncate transition-colors ${
                          active
                            ? "text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}>
                          {name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer: active filter chips + clear */}
            {hasActiveFilters(state, { listing_type: defaultOperacion, categoria: defaultCategoria }) && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap gap-1.5">
                  {state.categoria && state.categoria !== defaultCategoria && (
                    <FilterChip label={state.categoria === "residencial" ? "Residencial" : state.categoria === "comercial" ? "Comercial" : "Terreno"} onRemove={() => handleChange({ ...state, categoria: defaultCategoria as MarketFilterState["categoria"] })} />
                  )}
                  {state.tipos.map((t) => (
                    <FilterChip key={t} label={PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t} onRemove={() => handleChange({ ...state, tipos: state.tipos.filter((x) => x !== t) })} />
                  ))}
                  {state.zonas.map((z) => (
                    <FilterChip key={z} label={ZONES.find((zn) => zn.slug === z)?.name ?? z} onRemove={() => handleChange({ ...state, zonas: state.zonas.filter((x) => x !== z) })} />
                  ))}
                  {(state.precio_min || state.precio_max) && (
                    <FilterChip label={`Precio: ${state.precio_min || "0"} — ${state.precio_max || "∞"}`} onRemove={() => handleChange({ ...state, precio_min: "", precio_max: "" })} />
                  )}
                  {(state.area_min || state.area_max) && (
                    <FilterChip label={`Área: ${state.area_min || "0"} — ${state.area_max || "∞"} m²`} onRemove={() => handleChange({ ...state, area_min: "", area_max: "" })} />
                  )}
                  {state.recamaras.map((r) => (
                    <FilterChip key={r} label={`${r === 4 ? "4+" : r} rec`} onRemove={() => handleChange({ ...state, recamaras: state.recamaras.filter((x) => x !== r) })} />
                  ))}
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 shrink-0 ml-3"
                >
                  <Icon name="close" className="text-xs" />
                  Limpiar todo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-blue-900/30 text-slate-800 dark:text-blue-300 text-[11px] font-bold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 dark:hover:text-slate-200 transition-colors">
        <Icon name="close" className="text-[10px]" />
      </button>
    </span>
  )
}
