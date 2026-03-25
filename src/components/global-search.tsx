"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"
import type { SearchResults, SearchSuggestion } from "@/app/api/search/route"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

interface GlobalSearchProps {
  /** Called when mobile overlay should close (from parent) */
  onClose?: () => void
  /** Whether this is the mobile full-screen mode */
  mobileMode?: boolean
}

export function GlobalSearch({ onClose, mobileMode = false }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ zonas: [] })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const allSuggestions: SearchSuggestion[] = [
    ...results.zonas,
  ]

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults({ zonas: [] })
      setOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: SearchResults) => {
        if (cancelled) return
        setResults(data)
        setActiveIndex(-1)
        setOpen(data.zonas.length > 0)
      })
      .catch(() => {
        if (!cancelled) setResults({ zonas: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "Enter" && query.length >= 3) {
          router.push(`/buscar?q=${encodeURIComponent(query)}`)
        }
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, allSuggestions.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (activeIndex >= 0 && allSuggestions[activeIndex]) {
          navigateTo(allSuggestions[activeIndex].href)
        } else if (query.length >= 3) {
          router.push(`/buscar?q=${encodeURIComponent(query)}`)
          setOpen(false)
          onClose?.()
        }
      } else if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
        onClose?.()
      }
    },
    [open, activeIndex, allSuggestions, query, router, onClose]
  )

  const navigateTo = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery("")
    onClose?.()
  }

  // Close on outside click
  useEffect(() => {
    if (mobileMode) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [mobileMode])

  // Auto-focus in mobile mode
  useEffect(() => {
    if (mobileMode) {
      inputRef.current?.focus()
    }
  }, [mobileMode])

  const hasResults = results.zonas.length > 0

  return (
    <div ref={containerRef} className={mobileMode ? "w-full" : "relative w-full max-w-md"}>
      {/* Input */}
      <div className="relative">
        {loading ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasResults) setOpen(true)
          }}
          placeholder="Buscar zona o colonia..."
          className={`w-full border-none rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all ${
            mobileMode
              ? "bg-slate-100 focus:ring-2 focus:ring-blue-500/30 text-base"
              : "bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
          }`}
          aria-label="Buscar zonas"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <Icon name="close" className="text-sm" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && hasResults && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 ${
            mobileMode ? "relative mt-4 shadow-none border-0" : ""
          }`}
          role="listbox"
        >
          {/* Zonas group */}
          {results.zonas.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zonas</span>
              </div>
              {results.zonas.map((item, idx) => (
                <SuggestionRow
                  key={item.id}
                  item={item}
                  active={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onSelect={() => navigateTo(item.href)}
                />
              ))}
            </div>
          )}

          {/* Propiedades group — oculto: no mostramos listings individuales */}
        </div>
      )}

      {/* Hint when typing but not enough chars */}
      {query.length > 0 && query.length < 3 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 text-xs text-slate-400 z-50">
          Escribe al menos 3 caracteres para buscar
        </div>
      )}
    </div>
  )
}

interface SuggestionRowProps {
  item: SearchSuggestion
  active: boolean
  onMouseEnter: () => void
  onSelect: () => void
}

function SuggestionRow({ item, active, onMouseEnter, onSelect }: SuggestionRowProps) {
  const icon = "location_on"
  return (
    <button
      role="option"
      aria-selected={active}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        active ? "bg-slate-50" : "hover:bg-slate-50"
      }`}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          item.type === "zona"
            ? "bg-slate-100 text-slate-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon name={icon} className="text-sm" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
        <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
      </div>
    </button>
  )
}
