import { Suspense } from "react"
import { getZoneMetrics } from "@/lib/data/zones"
import { getListings } from "@/lib/data/listings"
import { MapPageClient } from "./map-page-client"
import type { ZoneMetrics } from "@/types/database"

export const metadata = {
  title: "Mapa Interactivo — Inmobiq",
  description: "Mapa interactivo de Tijuana con zonas y listings geolocalizados.",
}

export default async function MapaPage() {
  const [zones, { listings }] = await Promise.all([
    getZoneMetrics(),
    getListings({ }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
            Mapa Interactivo
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Tijuana — Mapa de Precios
        </h2>
        <p className="text-slate-500 max-w-xl font-medium text-sm">
          Zonas coloreadas por precio promedio/m². Haz clic en una zona para ver su análisis.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[600px] bg-slate-100 rounded-xl flex items-center justify-center">
            <div className="text-slate-400 text-sm font-medium">Cargando mapa…</div>
          </div>
        }
      >
        <MapPageClient zones={zones as ZoneMetrics[]} listings={listings} />
      </Suspense>
    </div>
  )
}
