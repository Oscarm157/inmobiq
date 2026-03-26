import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { USD_TO_MXN } from "@/lib/data/normalize"

/** @deprecated Use USD_TO_MXN from normalize.ts */
export const MXN_USD_RATE = USD_TO_MXN

export function formatCurrency(value: number, currency: "MXN" | "USD" = "MXN", rate?: number): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value / (rate ?? USD_TO_MXN))
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

export function formatArea(
  area_m2: number,
  area_construccion_m2?: number | null,
  area_terreno_m2?: number | null,
  property_type?: string,
): string {
  if (property_type === "casa" && area_construccion_m2 && area_terreno_m2 && area_construccion_m2 !== area_terreno_m2) {
    return `${formatNumber(Math.round(area_construccion_m2))}m² constr. · ${formatNumber(Math.round(area_terreno_m2))}m² terr.`
  }
  if (property_type === "terreno") {
    return `${formatNumber(Math.round(area_m2))}m² terr.`
  }
  return `${formatNumber(Math.round(area_m2))}m²`
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function toUSD(mxn: number): number {
  return Math.round(mxn / MXN_USD_RATE)
}
