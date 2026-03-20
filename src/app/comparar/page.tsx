import { Suspense } from "react"
import { ComparadorClient } from "./comparador-client"
import { getZoneMetrics } from "@/lib/data/zones"

export const metadata = {
  title: "Comparador de Zonas — Inmobiq",
  description: "Compara métricas de 2 a 3 zonas de Tijuana lado a lado.",
}

export default async function ComparadorPage({
  searchParams,
}: {
  searchParams: Promise<{ zonas?: string }>
}) {
  const { zonas } = await searchParams
  const allZones = await getZoneMetrics()
  const selectedSlugs = zonas
    ? zonas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  return (
    <Suspense>
      <ComparadorClient allZones={allZones} initialSlugs={selectedSlugs} />
    </Suspense>
  )
}
