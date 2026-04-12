"use client"

import { useCurrency } from "@/contexts/currency-context"

interface PriceProps {
  value: number
  perM2?: boolean
  className?: string
  suffix?: string
}

/** Client component that renders a price respecting the user's currency preference */
export function Price({ value, perM2, className, suffix }: PriceProps) {
  const { formatPrice, formatPricePerM2 } = useCurrency()
  if (!Number.isFinite(value) || value <= 0) {
    return <span className={className}>—</span>
  }
  const formatted = perM2 ? formatPricePerM2(value) : formatPrice(value)
  return <span className={className}>{formatted}{suffix}</span>
}
