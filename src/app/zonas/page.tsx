import { Suspense } from "react"
import { Icon } from "@/components/icon"
import { Breadcrumb } from "@/components/breadcrumb"
import { getZoneMetrics } from "@/lib/data/zones"
import { ZonesGridClient } from "./zones-grid-client"

export const metadata = {
  title: "Zonas — Inmobiq",
  description: "Explora todas las zonas inmobiliarias de Tijuana. Compara precios, tendencias e inventario.",
}

export default async function ZonasPage() {
  const zones = await getZoneMetrics()
  const publicZones = zones.filter((z) => z.zone_slug !== "otros")

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Zonas" }]} />
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold rounded-full tracking-widest uppercase">
            Zonas
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold rounded-full tracking-widest uppercase">
            {publicZones.length} zonas
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Zonas de Tijuana
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl font-medium">
          Explora el mercado inmobiliario por zona. Haz clic en una zona para ver su análisis completo.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
        <ZonesGridClient zones={publicZones} />
      </Suspense>
    </div>
  )
}
