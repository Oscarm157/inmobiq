"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import type { PropertyType, ListingType } from "@/types/database"

/** Prevent scroll-wheel from changing number inputs */
function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur()
}

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "casa", label: "Casa", icon: "home" },
  { value: "departamento", label: "Depto", icon: "apartment" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
  { value: "local", label: "Local", icon: "store" },
  { value: "oficina", label: "Oficina", icon: "business" },
]

const ZONES = [
  { slug: "zona-rio", name: "Zona Río" },
  { slug: "playas-de-tijuana", name: "Playas de Tijuana" },
  { slug: "otay", name: "Otay" },
  { slug: "chapultepec", name: "Chapultepec" },
  { slug: "hipodromo", name: "Hipódromo" },
  { slug: "centro", name: "Centro" },
  { slug: "residencial-del-bosque", name: "Residencial del Bosque" },
  { slug: "la-mesa", name: "La Mesa" },
]

const BEDROOMS = [1, 2, 3, 4] as const

export interface MarketFilterState {
  tipos: PropertyType[]
  zonas: string[]
  listing_type: ListingType | ""
  precio_min: string
  precio_max: string
  area_min: string
  area_max: string
  recamaras: number[]
}

export function buildMarketParams(state: MarketFilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (state.tipos.length) p.set("tipo", state.tipos.join(","))
  if (state.zonas.length) p.set("zona", state.zonas.join(","))
  if (state.listing_type) p.set("operacion", state.listing_type)
  if (state.precio_min) p.set("precio_min", state.precio_min)
  if (state.precio_max) p.set("precio_max", state.precio_max)
  if (state.area_min) p.set("area_min", state.area_min)
  if (state.area_max) p.set("area_max", state.area_max)
  if (state.recamaras.length) p.set("rec", state.recamaras.join(","))
  return p
}

export function parseMarketParams(sp: URLSearchParams): MarketFilterState {
  return {
    tipos: sp.get("tipo") ? (sp.get("tipo")!.split(",") as PropertyType[]) : [],
    zonas: sp.get("zona") ? sp.get("zona")!.split(",") : [],
    listing_type: (sp.get("operacion") as ListingType) || "",
    precio_min: sp.get("precio_min") ?? "",
    precio_max: sp.get("precio_max") ?? "",
    area_min: sp.get("area_min") ?? "",
    area_max: sp.get("area_max") ?? "",
    recamaras: sp.get("rec") ? sp.get("rec")!.split(",").map(Number) : [],
  }
}

function hasActiveFilters(state: MarketFilterState) {
  return (
    state.tipos.length > 0 ||
    state.zonas.length > 0 ||
    state.listing_type !== "" ||
    state.precio_min !== "" ||
    state.precio_max !== "" ||
    state.area_min !== "" ||
    state.area_max !== "" ||
    state.recamaras.length > 0
  )
}

function countActiveFilters(state: MarketFilterState) {
  return (
    state.tipos.length +
    state.zonas.length +
    (state.listing_type ? 1 : 0) +
    (state.precio_min || state.precio_max ? 1 : 0) +
    (state.area_min || state.area_max ? 1 : 0) +
    state.recamaras.length
  )
}

export function MarketFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [state, setState] = useState<MarketFilterState>(() => parseMarketParams(searchParams))
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { formatPrice, currency } = useCurrency()

  // Sync from URL on navigation
  useEffect(() => {
    setState(parseMarketParams(searchParams))
  }, [searchParams])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Close panel on Escape key
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open])

  const pushFilters = useCallback(
    (next: MarketFilterState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = buildMarketParams(next)
        const qs = params.toString()
        startTransition(() => {
          router.push(qs ? `${pathname}?${qs}` : pathname)
        })
      }, 300)
    },
    [router, pathname]
  )

  const handleChange = (next: MarketFilterState) => {
    setState(next)
    pushFilters(next)
  }

  const handleClear = () => {
    const empty: MarketFilterState = {
      tipos: [], zonas: [], listing_type: "",
      precio_min: "", precio_max: "",
      area_min: "", area_max: "",
      recamaras: [],
    }
    setState(empty)
    startTransition(() => router.push(pathname))
  }

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const activeCount = countActiveFilters(state)

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-6 py-3 border rounded-full text-sm font-bold shadow-sm transition-all ${
          open || activeCount > 0
            ? "bg-blue-700 text-white border-blue-700"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
      >
        <Icon name="filter_list" className="text-sm" />
        Filtros
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-white text-blue-700">
            {activeCount}
          </span>
        )}
        <Icon name={open ? "expand_less" : "expand_more"} className="text-sm" />
      </button>

      {/* Inline panel */}
      {open && (
        <div className="mt-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Operación */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operación</p>
              <div className="flex gap-2">
                {(["", "venta", "renta"] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => handleChange({ ...state, listing_type: op })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      state.listing_type === op
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {op === "" ? "Todas" : op === "venta" ? "Venta" : "Renta"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de propiedad */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Propiedad</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(({ value, label, icon }) => {
                  const active = state.tipos.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() => handleChange({ ...state, tipos: toggle(state.tipos, value) })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        active
                          ? "bg-blue-700 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
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
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recámaras</p>
              <div className="flex gap-2">
                {BEDROOMS.map((r) => {
                  const active = state.recamaras.includes(r)
                  return (
                    <button
                      key={r}
                      onClick={() => handleChange({ ...state, recamaras: toggle(state.recamaras, r) })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        active
                          ? "bg-blue-700 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {r === 4 ? "4+" : r}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rango de precio */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rango de Precio ({currency})</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Mínimo"
                  value={state.precio_min}
                  onChange={(e) => handleChange({ ...state, precio_min: e.target.value })}
                  onWheel={preventScrollChange}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Máximo"
                  value={state.precio_max}
                  onChange={(e) => handleChange({ ...state, precio_max: e.target.value })}
                  onWheel={preventScrollChange}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(state.precio_min || state.precio_max) && (
                <p className="text-[10px] text-slate-500 mt-1">
                  {state.precio_min ? formatPrice(Number(state.precio_min)) : "Sin mínimo"} —{" "}
                  {state.precio_max ? formatPrice(Number(state.precio_max)) : "Sin máximo"}
                </p>
              )}
            </div>

            {/* Superficie */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Superficie (m²)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Mín m²"
                  value={state.area_min}
                  onChange={(e) => handleChange({ ...state, area_min: e.target.value })}
                  onWheel={preventScrollChange}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Máx m²"
                  value={state.area_max}
                  onChange={(e) => handleChange({ ...state, area_max: e.target.value })}
                  onWheel={preventScrollChange}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Zonas */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Zona</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ZONES.map(({ slug, name }) => {
                  const active = state.zonas.includes(slug)
                  return (
                    <label key={slug} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleChange({ ...state, zonas: toggle(state.zonas, slug) })}
                        className="w-3.5 h-3.5 rounded accent-blue-700"
                      />
                      <span className={`text-xs font-medium transition-colors ${active ? "text-blue-700 font-bold" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                        {name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer: active filter chips + clear */}
          {hasActiveFilters(state) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex flex-wrap gap-1.5">
                {state.listing_type && (
                  <FilterChip label={state.listing_type === "venta" ? "Venta" : "Renta"} onRemove={() => handleChange({ ...state, listing_type: "" })} />
                )}
                {state.tipos.map((t) => (
                  <FilterChip key={t} label={PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t} onRemove={() => handleChange({ ...state, tipos: state.tipos.filter((x) => x !== t) })} />
                ))}
                {state.zonas.map((z) => (
                  <FilterChip key={z} label={ZONES.find((zn) => zn.slug === z)?.name ?? z} onRemove={() => handleChange({ ...state, zonas: state.zonas.filter((x) => x !== z) })} />
                ))}
                {(state.precio_min || state.precio_max) && (
                  <FilterChip label={`Precio: ${state.precio_min || "0"}-${state.precio_max || "∞"}`} onRemove={() => handleChange({ ...state, precio_min: "", precio_max: "" })} />
                )}
                {(state.area_min || state.area_max) && (
                  <FilterChip label={`Área: ${state.area_min || "0"}-${state.area_max || "∞"} m²`} onRemove={() => handleChange({ ...state, area_min: "", area_max: "" })} />
                )}
                {state.recamaras.map((r) => (
                  <FilterChip key={r} label={`${r === 4 ? "4+" : r} rec`} onRemove={() => handleChange({ ...state, recamaras: state.recamaras.filter((x) => x !== r) })} />
                ))}
              </div>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 shrink-0 ml-3"
              >
                <Icon name="close" className="text-xs" />
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
        <Icon name="close" className="text-[10px]" />
      </button>
    </span>
  )
}
