"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ZoneMetrics } from "@/types/database"
import {
  ZONE_GEOJSON,
  TIJUANA_CENTER,
  getPriceColor,
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

      // Enrich GeoJSON with colors
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
          generateId: true,
        })

        // ── Glow layer (soft halo) ──
        map.addLayer({
          id: "zones-glow",
          type: "line",
          source: "zones",
          paint: {
            "line-color": ["get", "color"],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              8,
              5,
            ],
            "line-blur": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              12,
              7,
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.4,
              0.2,
            ],
            "line-width-transition": { duration: 300 },
            "line-blur-transition": { duration: 300 },
            "line-opacity-transition": { duration: 300 },
          },
        })

        map.addLayer({
          id: "zones-fill",
          type: "fill",
          source: "zones",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.65,
              0.5,
            ],
            "fill-opacity-transition": { duration: 300 },
          },
        })

        map.addLayer({
          id: "zones-line",
          type: "line",
          source: "zones",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#1e3a8a",
              "#3b82f6",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              1.5,
              1,
            ],
            "line-blur": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.5,
              1.5,
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.9,
              0.6,
            ],
            "line-width-transition": { duration: 300 },
            "line-blur-transition": { duration: 300 },
            "line-opacity-transition": { duration: 300 },
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
            "text-color": "#0f172a",
            "text-halo-color": "rgba(255,255,255,0.95)",
            "text-halo-width": 1.5,
          },
        })

        // Re-enable pointer events for hover/click
        const canvas = map.getCanvas()
        canvas.style.pointerEvents = "auto"

        let hoveredId: number | null = null

        const popup = new mapboxgl.default.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "inmobiq-popup",
        })

        map.on("mousemove", "zones-fill", (e) => {
          if (!e.features?.length || !map) return
          canvas.style.cursor = "pointer"

          const feature = e.features[0]
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "zones", id: hoveredId },
              { hover: false }
            )
          }
          hoveredId = feature.id as number
          map.setFeatureState(
            { source: "zones", id: hoveredId },
            { hover: true }
          )

          const props = feature.properties as {
            name: string
            avgPrice: number
          }
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px">
                <div style="font-weight:700;font-size:12px;color:#0f172a">${props.name}</div>
                <div style="font-size:13px;font-weight:800;color:#1e40af">${formatPrice(props.avgPrice)}<span style="font-size:10px;font-weight:500;color:#64748b">/m²</span></div>
              </div>`
            )
            .addTo(map)
        })

        map.on("mouseleave", "zones-fill", () => {
          if (!map) return
          canvas.style.cursor = ""
          popup.remove()
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "zones", id: hoveredId },
              { hover: false }
            )
            hoveredId = null
          }
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
      {/* Gradient legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-200/80">
        <p className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
          Precio /m²
        </p>
        <div
          className="h-1.5 rounded-full mb-1"
          style={{
            background:
              "linear-gradient(to right, #bfdbfe, #93c5fd, #60a5fa, #3b82f6, #1e40af)",
            width: "80px",
          }}
        />
        <div className="flex justify-between text-[8px] text-slate-400 font-semibold" style={{ width: "80px" }}>
          <span>&lt;$20k</span>
          <span>$40k+</span>
        </div>
      </div>
      <div className="absolute bottom-2 right-2 z-[1000]">
        <a
          href="/mapa"
          className="px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-full shadow-lg hover:bg-blue-800 transition-colors"
        >
          Ver mapa completo →
        </a>
      </div>
    </div>
  )
}
