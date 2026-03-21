"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import type { PropertyType, ListingType } from "@/types/database"
import { ZONES } from "@/lib/filter-utils"

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "casa", label: "Casa", icon: "home" },
  { value: "departamento", label: "Depto", icon: "apartment" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
  { value: "local", label: "Local", icon: "store" },
  { value: "oficina", label: "Oficina", icon: "business" },
]

const BEDROOMS = [1, 2, 3, 4] as const

interface FilterState {
  tipos: PropertyType[]
  zonas: string[]
  listing_type: ListingType | ""
  precio_min: string
  precio_max: string
  area_min: string
  area_max: string
  recamaras: number[]
}

function buildParams(state: FilterState): URLSearchParams {
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

function parseParams(sp: URLSearchParams): FilterState {
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

function hasActiveFilters(state: FilterState) {
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

interface FilterPanelProps {
  state: FilterState
  onChange: (next: FilterState) => void
  onClear: () => void
  total: number
}

function FilterPanel({ state, onChange, onClear, total }: FilterPanelProps) {
  const { formatPrice, currency } = useCurrency()
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  return (
    <div className="flex flex-col gap-6">
      {/* Operación */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operación</p>
        <div className="flex gap-2">
          {(["", "venta", "renta"] as const).map((op) => (
            <button
              key={op}
              onClick={() => onChange({ ...state, listing_type: op })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                state.listing_type === op
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                onClick={() => onChange({ ...state, tipos: toggle(state.tipos, value) })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  active
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon name={icon} className="text-xs" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Zonas */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Zona</p>
        <div className="flex flex-col gap-1.5">
          {ZONES.map(({ slug, name }) => {
            const active = state.zonas.includes(slug)
            return (
              <label key={slug} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onChange({ ...state, zonas: toggle(state.zonas, slug) })}
                  className="w-4 h-4 rounded accent-blue-700"
                />
                <span className={`text-xs font-medium transition-colors ${active ? "text-blue-700 font-bold" : "text-slate-600 group-hover:text-slate-900"}`}>
                  {name}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Rango de precios */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rango de Precio ({currency})</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mínimo"
            value={state.precio_min}
            onChange={(e) => onChange({ ...state, precio_min: e.target.value })}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Máximo"
            value={state.precio_max}
            onChange={(e) => onChange({ ...state, precio_max: e.target.value })}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(state.precio_min || state.precio_max) && (
          <p className="text-[10px] text-slate-500 mt-1">
            {state.precio_min ? formatPrice(Number(state.precio_min)) : "Sin mínimo"} —{" "}
            {state.precio_max ? formatPrice(Number(state.precio_max)) : "Sin máximo"}
          </p>
        )}
      </div>

      {/* Superficie m2 */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Superficie (m²)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín m²"
            value={state.area_min}
            onChange={(e) => onChange({ ...state, area_min: e.target.value })}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Máx m²"
            value={state.area_max}
            onChange={(e) => onChange({ ...state, area_max: e.target.value })}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                onClick={() => onChange({ ...state, recamaras: toggle(state.recamaras, r) })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r === 4 ? "4+" : r}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-600">
          <span className="text-blue-700 font-black">{total}</span> propiedades
        </p>
        {hasActiveFilters(state) && (
          <button
            onClick={onClear}
            className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <Icon name="close" className="text-xs" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}

interface ListingsFiltersProps {
  total: number
}

export function ListingsFilters({ total }: ListingsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [state, setState] = useState<FilterState>(() => parseParams(searchParams))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from URL on navigation
  useEffect(() => {
    setState(parseParams(searchParams))
  }, [searchParams])

  const pushFilters = useCallback(
    (next: FilterState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = buildParams(next)
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`)
        })
      }, 300)
    },
    [router, pathname]
  )

  const handleChange = (next: FilterState) => {
    setState(next)
    pushFilters(next)
  }

  const handleClear = () => {
    const empty: FilterState = {
      tipos: [], zonas: [], listing_type: "",
      precio_min: "", precio_max: "",
      area_min: "", area_max: "",
      recamaras: [],
    }
    setState(empty)
    startTransition(() => router.push(pathname))
  }

  const activeCount =
    state.tipos.length +
    state.zonas.length +
    (state.listing_type ? 1 : 0) +
    (state.precio_min || state.precio_max ? 1 : 0) +
    (state.area_min || state.area_max ? 1 : 0) +
    state.recamaras.length

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-10"}`}>
        <div className={`bg-white rounded-xl card-shadow sticky top-6 ${sidebarOpen ? "p-5" : "p-2"}`}>
          <div className="flex items-center justify-between mb-4">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black">Filtros</h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-700 text-white text-[10px] font-black rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              title={sidebarOpen ? "Colapsar filtros" : "Expandir filtros"}
            >
              <Icon name={sidebarOpen ? "chevron_left" : "tune"} className="text-sm" />
            </button>
          </div>

          {sidebarOpen && (
            <FilterPanel
              state={state}
              onChange={handleChange}
              onClear={handleClear}
              total={total}
            />
          )}
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-600">
          <span className="text-blue-700 font-black">{total}</span> propiedades
        </p>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold shadow-sm"
        >
          <Icon name="tune" className="text-sm" />
          Filtros
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-700 text-white text-[10px] font-black rounded-full">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black">Filtros</h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Icon name="close" className="text-slate-600" />
              </button>
            </div>
            <FilterPanel
              state={state}
              onChange={(next) => {
                handleChange(next)
              }}
              onClear={() => {
                handleClear()
                setMobileOpen(false)
              }}
              total={total}
            />
            <button
              onClick={() => setMobileOpen(false)}
              className="w-full mt-5 py-3 bg-blue-700 text-white rounded-xl text-sm font-black"
            >
              Ver {total} propiedades
            </button>
          </div>
        </div>
      )}
    </>
  )
}
