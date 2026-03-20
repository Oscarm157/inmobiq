"use client"

import dynamic from "next/dynamic"
import type { ZoneMetrics, Listing } from "@/types/database"

const InteractiveMap = dynamic(
  () => import("./interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium">Cargando mapa…</div>
      </div>
    ),
  }
)

interface ZoneMapWrapperProps {
  zones: ZoneMetrics[]
  listings: Listing[]
  focusZoneSlug: string
}

export function ZoneMapWrapper({ zones, listings, focusZoneSlug }: ZoneMapWrapperProps) {
  return (
    <InteractiveMap
      zones={zones}
      listings={listings}
      focusZoneSlug={focusZoneSlug}
      height="380px"
      showLayerToggle
    />
  )
}
