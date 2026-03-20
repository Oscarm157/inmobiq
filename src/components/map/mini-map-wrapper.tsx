"use client"

import dynamic from "next/dynamic"
import type { ZoneMetrics } from "@/types/database"

const MiniMap = dynamic(
  () => import("./mini-map").then((m) => m.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando mapa…</div>
      </div>
    ),
  }
)

interface MiniMapWrapperProps {
  zones: ZoneMetrics[]
}

export function MiniMapWrapper({ zones }: MiniMapWrapperProps) {
  return <MiniMap zones={zones} height="360px" />
}
