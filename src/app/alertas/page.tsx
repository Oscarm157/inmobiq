import { Suspense } from "react"
import { getZoneMetrics } from "@/lib/data/zones"
import { AlertasClient } from "./alertas-client"

export const metadata = {
  title: "Mis Alertas — Inmobiq",
  description: "Configura alertas de precios e inventario para zonas de Tijuana.",
}

export default async function AlertasPage() {
  const zones = await getZoneMetrics()
  return (
    <Suspense>
      <AlertasClient zones={zones} />
    </Suspense>
  )
}
