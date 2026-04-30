"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import { ValuationReport } from "@/components/brujula/valuation-report"
import type { ValuationResult, ValuationVerdict, PropertyType, ListingType } from "@/types/database"

const VERDICT_CONFIG: Record<ValuationVerdict, { label: string; accent: string; bg: string }> = {
  muy_barata: { label: "Muy barato", accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  barata:     { label: "Barato",     accent: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/30" },
  precio_justo: { label: "Precio justo", accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
  cara:       { label: "Caro",       accent: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30" },
  muy_cara:   { label: "Muy caro",   accent: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/30" },
}

interface Props {
  result: ValuationResult
  narrative: string
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    bedrooms: number | null
    bathrooms: number | null
    parking: number | null
    address: string | null
  }
}

export function ValuationDetailClient({ result, narrative, property }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/brujula"
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Icon name="arrow_back" className="text-base" />
          Brújula
        </Link>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg}`}>
          <span className={`text-2xl font-black leading-none ${cfg.accent}`}>{result.score}</span>
          <span className={`text-sm font-bold ${cfg.accent}`}>{cfg.label}</span>
        </div>
      </div>

      <ValuationReport
        result={result}
        narrative={narrative}
        property={property}
      />
    </motion.div>
  )
}
