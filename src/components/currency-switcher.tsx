"use client"

import { useState, useRef, useEffect } from "react"
import { Icon } from "@/components/icon"
import { useCurrency, type CurrencyCode } from "@/contexts/currency-context"

export function CurrencySwitcher({ inline = false }: { inline?: boolean }) {
  const { currency, exchangeRate, setCurrency, setExchangeRate } = useCurrency()
  const [open, setOpen] = useState(false)
  const [rateInput, setRateInput] = useState(String(exchangeRate))
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (inline) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [inline])

  // Sync input when exchangeRate changes externally
  useEffect(() => {
    setRateInput(String(exchangeRate))
  }, [exchangeRate])

  const handleToggle = (c: CurrencyCode) => {
    setCurrency(c)
  }

  const handleRateBlur = () => {
    const parsed = parseFloat(rateInput)
    if (!isNaN(parsed) && parsed > 0) {
      setExchangeRate(parsed)
    } else {
      setRateInput(String(exchangeRate))
    }
  }

  const currencyContent = (
    <>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        Moneda de visualización
      </p>
      <div className="flex gap-1 mb-3">
        {(["MXN", "USD"] as CurrencyCode[]).map((c) => (
          <button
            key={c}
            onClick={() => handleToggle(c)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              currency === c
                ? "bg-slate-700 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
        Tipo de cambio (MXN/USD)
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">1 USD =</span>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRateBlur()}
          className="flex-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">MXN</span>
      </div>
      <button
        onClick={handleRateBlur}
        className="w-full mt-2 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Actualizar
      </button>
    </>
  )

  if (inline) {
    return <div className="px-3 py-2">{currencyContent}</div>
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
        aria-label="Cambiar moneda"
        title="Cambiar moneda y tipo de cambio"
      >
        <Icon name="currency_exchange" className="text-sm" />
        <span>{currency}</span>
        <Icon name={open ? "expand_less" : "expand_more"} className="text-sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-50">
          {currencyContent}
        </div>
      )}
    </div>
  )
}
