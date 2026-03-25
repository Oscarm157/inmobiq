"use client"

import Link from "next/link"
import { Icon } from "@/components/icon"
import { ValuationReport } from "@/components/brujula/valuation-report"
import type { ValuationResult, PropertyType, ListingType } from "@/types/database"

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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/brujula"
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline"
        >
          <Icon name="arrow_back" className="text-base" />
          Volver a Brújula
        </Link>
      </div>

      <ValuationReport
        result={result}
        narrative={narrative}
        property={property}
      />
    </div>
  )
}
