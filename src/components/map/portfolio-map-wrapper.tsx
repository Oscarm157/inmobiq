"use client"

import dynamic from "next/dynamic"
import type { ZoneMetrics } from "@/types/database"

const InteractiveMap = dynamic(
  () => import("./interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium">Cargando mapa…</div>
      </div>
    ),
  }
)

interface PortfolioMapWrapperProps {
  zones: ZoneMetrics[]
}

export function PortfolioMapWrapper({ zones }: PortfolioMapWrapperProps) {
  return (
    <InteractiveMap
      zones={zones}
      height="320px"
      showLayerToggle
    />
  )
}
