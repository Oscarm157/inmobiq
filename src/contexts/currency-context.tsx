"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { USD_TO_MXN } from "@/lib/data/normalize"

export type CurrencyCode = "MXN" | "USD"

const DEFAULT_EXCHANGE_RATE = USD_TO_MXN

interface CurrencyContextType {
  currency: CurrencyCode
  exchangeRate: number
  setCurrency: (c: CurrencyCode) => void
  setExchangeRate: (rate: number) => void
  /** Convert a value stored in MXN to the selected display currency */
  convert: (valueMxn: number) => number
  /** Format a MXN value into the selected currency string */
  formatPrice: (valueMxn: number) => string
  /** Format as price/m² */
  formatPricePerM2: (valueMxn: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "MXN",
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  setCurrency: () => {},
  setExchangeRate: () => {},
  convert: (v) => v,
  formatPrice: (v) => `$${v.toLocaleString("es-MX")}`,
  formatPricePerM2: (v) => `$${v.toLocaleString("es-MX")}/m²`,
})

export function useCurrency() {
  return useContext(CurrencyContext)
}

function formatValue(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(currency === "MXN" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("MXN")
  const [exchangeRate, setExchangeRateState] = useState(DEFAULT_EXCHANGE_RATE)
  const [demoMultiplier, setDemoMultiplier] = useState(1.0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("inmobiq_currency") as CurrencyCode | null
    if (stored === "MXN" || stored === "USD") setCurrencyState(stored)

    const storedRate = localStorage.getItem("inmobiq_exchange_rate")
    if (storedRate) {
      const parsed = parseFloat(storedRate)
      if (!isNaN(parsed) && parsed > 0) setExchangeRateState(parsed)
    }

    // Demo mode: check URL for ?demo=true (client-side only)
    const params = new URLSearchParams(window.location.search)
    if (params.get("demo") === "true") {
      setDemoMultiplier(0.93 + Math.random() * 0.13)
      timerRef.current = setInterval(() => {
        setDemoMultiplier(0.93 + Math.random() * 0.13)
      }, 2500)
    }

    return () => clearInterval(timerRef.current)
  }, [])

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c)
    localStorage.setItem("inmobiq_currency", c)
  }

  const setExchangeRate = (rate: number) => {
    if (rate > 0) {
      setExchangeRateState(rate)
      localStorage.setItem("inmobiq_exchange_rate", String(rate))
    }
  }

  const convert = useCallback(
    (valueMxn: number) => {
      const v = valueMxn * demoMultiplier
      return currency === "USD" ? v / exchangeRate : v
    },
    [currency, exchangeRate, demoMultiplier],
  )

  const formatPrice = useCallback(
    (valueMxn: number) => formatValue(convert(valueMxn), currency),
    [convert, currency],
  )

  const formatPricePerM2 = useCallback(
    (valueMxn: number) => `${formatValue(convert(valueMxn), currency)}/m²`,
    [convert, currency],
  )

  return (
    <CurrencyContext.Provider
      value={{ currency, exchangeRate, setCurrency, setExchangeRate, convert, formatPrice, formatPricePerM2 }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}
