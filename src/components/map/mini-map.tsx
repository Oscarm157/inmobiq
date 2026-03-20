"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ZoneMetrics } from "@/types/database"
import { TIJUANA_ZONE_GEO, TIJUANA_CENTER, getPriceColor } from "@/lib/geo-data"
import { useCurrency } from "@/contexts/currency-context"

interface MiniMapProps {
  zones: ZoneMetrics[]
  height?: string
}

export function MiniMap({ zones, height = "280px" }: MiniMapProps) {
  const { formatPrice } = useCurrency()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        center: TIJUANA_CENTER,
        zoom: 11,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      TIJUANA_ZONE_GEO.forEach((geo) => {
        const metrics = zones.find((z) => z.zone_slug === geo.slug)
        const color = metrics ? getPriceColor(metrics.avg_price_per_m2) : "#94a3b8"

        const polygon = L.polygon(geo.polygon as [number, number][], {
          color: "#1e40af",
          weight: 1.5,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.6,
        })

        if (metrics) {
          polygon.bindTooltip(
            `<strong>${geo.name}</strong><br/>${formatPrice(metrics.avg_price_per_m2)}/m²`,
            { direction: "top", sticky: true }
          )
        }

        polygon.on("click", () => {
          router.push(`/zona/${geo.slug}`)
        })

        polygon.on("mouseover", () => {
          polygon.setStyle({ fillOpacity: 0.85, weight: 2.5 })
          ;(map.getContainer() as HTMLElement).style.cursor = "pointer"
        })
        polygon.on("mouseout", () => {
          polygon.setStyle({ fillOpacity: 0.6, weight: 1.5 })
          ;(map.getContainer() as HTMLElement).style.cursor = ""
        })

        polygon.addTo(map)
      })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="bg-slate-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-slate-400 text-sm">Cargando mapa…</div>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ height }}
    >
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      <div className="absolute bottom-2 right-2 z-[1000]">
        <a
          href="/mapa"
          className="px-3 py-1.5 bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow hover:bg-blue-800 transition-colors"
        >
          Ver mapa completo →
        </a>
      </div>
    </div>
  )
}
