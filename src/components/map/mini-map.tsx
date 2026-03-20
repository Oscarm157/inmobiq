"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ZoneMetrics } from "@/types/database"
import {
  ZONE_GEOJSON,
  TIJUANA_CENTER,
  getPriceColor,
  getZoneCentroid,
} from "@/lib/geo-data"
import { useCurrency } from "@/contexts/currency-context"

interface MiniMapProps {
  zones: ZoneMetrics[]
  height?: string
}

export function MiniMap({ zones, height = "280px" }: MiniMapProps) {
  const { formatPrice } = useCurrency()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    let map: mapboxgl.Map | null = null

    import("mapbox-gl").then((mapboxgl) => {
      if (!mapRef.current || mapInstanceRef.current) return

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!token) return

      mapboxgl.default.accessToken = token

      map = new mapboxgl.default.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: TIJUANA_CENTER,
        zoom: 11,
        interactive: false,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      // Build enriched GeoJSON with colors
      const enriched = {
        ...ZONE_GEOJSON,
        features: ZONE_GEOJSON.features.map((f) => {
          const props = f.properties as { slug: string; name: string }
          const metrics = zones.find((z) => z.zone_slug === props.slug)
          const color = metrics
            ? getPriceColor(metrics.avg_price_per_m2)
            : "#94a3b8"
          return {
            ...f,
            properties: {
              ...props,
              color,
              avgPrice: metrics?.avg_price_per_m2 ?? 0,
            },
          }
        }),
      }

      map.on("load", () => {
        if (!map) return

        map.addSource("zones", {
          type: "geojson",
          data: enriched as GeoJSON.FeatureCollection,
        })

        map.addLayer({
          id: "zones-fill",
          type: "fill",
          source: "zones",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.6,
          },
        })

        map.addLayer({
          id: "zones-line",
          type: "line",
          source: "zones",
          paint: {
            "line-color": "#1e40af",
            "line-width": 1.5,
            "line-opacity": 0.8,
          },
        })

        map.addLayer({
          id: "zones-labels",
          type: "symbol",
          source: "zones",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 10,
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#1e3a5f",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          },
        })

        // Re-enable pointer events for click/hover even though map is non-interactive
        const canvas = map.getCanvas()
        canvas.style.pointerEvents = "auto"

        // Popup for hover
        const popup = new mapboxgl.default.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })

        map.on("mousemove", "zones-fill", (e) => {
          if (!e.features?.length || !map) return
          canvas.style.cursor = "pointer"
          const props = e.features[0].properties as {
            name: string
            avgPrice: number
          }
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif"><strong>${props.name}</strong><br/>${formatPrice(props.avgPrice)}/m²</div>`
            )
            .addTo(map)
        })

        map.on("mouseleave", "zones-fill", () => {
          if (!map) return
          canvas.style.cursor = ""
          popup.remove()
        })

        map.on("click", "zones-fill", (e) => {
          if (!e.features?.length) return
          const slug = (e.features[0].properties as { slug: string }).slug
          router.push(`/zona/${slug}`)
        })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
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
      {/* Color legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <p className="text-[10px] font-bold text-slate-600 mb-1.5">
          Precio /m²
        </p>
        <div className="flex flex-col gap-1">
          {[
            { color: "#1e40af", label: "$40k+" },
            { color: "#3b82f6", label: "$32-40k" },
            { color: "#60a5fa", label: "$26-32k" },
            { color: "#93c5fd", label: "$20-26k" },
            { color: "#bfdbfe", label: "<$20k" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-slate-500 font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
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
