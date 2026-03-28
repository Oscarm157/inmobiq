import { Suspense } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { getZoneMetrics } from "@/lib/data/zones"
import { AlertasClient } from "./alertas-client"

export const metadata = {
  title: "Mis Alertas — Inmobiq",
  description: "Configura alertas de precios e inventario para zonas de Tijuana.",
}

export default async function AlertasPage() {
  const zones = await getZoneMetrics()
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Alertas" }]} />
      <Suspense>
        <AlertasClient zones={zones} />
      </Suspense>
    </div>
  )
}
