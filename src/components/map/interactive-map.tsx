"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import type { ZoneMetrics } from "@/types/database"
import {
  ZONE_GEOJSON,
  TIJUANA_CENTER,
  TIJUANA_BOUNDS,
  getPriceColor,
  getPriceLabel,
  getZoneCentroid,
} from "@/lib/geo-data"
import { useCurrency } from "@/contexts/currency-context"
import { getZoneActivityLabel } from "@/lib/activity-labels"

type LayerMode = "zones" | "heatmap"

interface InteractiveMapProps {
  zones: ZoneMetrics[]
  focusZoneSlug?: string
  height?: string
  showLayerToggle?: boolean
  onZoneClick?: (slug: string) => void
}

/** Generate synthetic heatmap points from zone metrics */
function generateHeatPoints(zones: ZoneMetrics[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  zones.forEach((z) => {
    const centroid = getZoneCentroid(z.zone_slug)
    if (!centroid) return

    // Generate points proportional to listing count (cap at 40 per zone)
    const count = Math.min(z.total_listings, 40)
    for (let i = 0; i < count; i++) {
      const seed1 = z.zone_slug.length * 1000 + i * 7 + 1
      const seed2 = z.zone_slug.length * 2000 + i * 13 + 3
      const lng = centroid[0] + (seededRandom(seed1) - 0.5) * 0.015
      const lat = centroid[1] + (seededRandom(seed2) - 0.5) * 0.012
      features.push({
        type: "Feature",
        properties: { price_per_m2: z.avg_price_per_m2 },
        geometry: { type: "Point", coordinates: [lng, lat] },
      })
    }
  })

  return { type: "FeatureCollection", features }
}

export function InteractiveMap({
  zones,
  focusZoneSlug,
  height = "500px",
  showLayerToggle = true,
  onZoneClick,
}: InteractiveMapProps) {
  const { formatPrice } = useCurrency()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [activeLayer, setActiveLayer] = useState<LayerMode>("zones")
  const [mounted, setMounted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const heatPoints = useMemo(() => generateHeatPoints(zones), [zones])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    import("mapbox-gl").then((mapboxgl) => {
      if (!mapRef.current || mapInstanceRef.current) return

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!token) return

      mapboxgl.default.accessToken = token

      const map = new mapboxgl.default.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: TIJUANA_CENTER,
        zoom: 12,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: TIJUANA_BOUNDS,
      })

      map.addControl(
        new mapboxgl.default.NavigationControl({ showCompass: false }),
        "top-right"
      )

      mapInstanceRef.current = map

      // Popup with clean styling
      popupRef.current = new mapboxgl.default.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
        offset: 15,
        className: "inmobiq-popup",
      })

      // Build enriched GeoJSON with zone metrics
      const enriched = {
        ...ZONE_GEOJSON,
        features: ZONE_GEOJSON.features.map((f) => {
          const props = f.properties as { slug: string; name: string }
          const metrics = zones.find((z) => z.zone_slug === props.slug)
          const color = metrics
            ? getPriceColor(metrics.avg_price_per_m2)
            : "#94a3b8"
          const priceLabel = metrics
            ? getPriceLabel(metrics.avg_price_per_m2)
            : "Sin datos"
          return {
            ...f,
            properties: {
              ...props,
              color,
              priceLabel,
              avgPrice: metrics?.avg_price_per_m2 ?? 0,
              totalListings: metrics?.total_listings ?? 0,
              priceTrend: metrics?.price_trend_pct ?? 0,
            },
          }
        }),
      }

      map.on("load", () => {
        // ── Zone layers ──
        map.addSource("zones", {
          type: "geojson",
          data: enriched as GeoJSON.FeatureCollection,
          generateId: true,
        })

        // ── Glow layer (soft halo around zones) ──
        map.addLayer({
          id: "zones-glow",
          type: "line",
          source: "zones",
          paint: {
            "line-color": ["get", "color"],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              10,
              6,
            ],
            "line-blur": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              14,
              8,
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.45,
              0.25,
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
            "text-size": 12,
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": false,
            "text-padding": 4,
          },
          paint: {
            "text-color": "#0f172a",
            "text-halo-color": "rgba(255,255,255,0.95)",
            "text-halo-width": 2,
          },
        })

        // ── Heatmap layer (synthetic from zone metrics) ──
        map.addSource("heatmap", {
          type: "geojson",
          data: heatPoints,
        })

        map.addLayer({
          id: "heatmap-heat",
          type: "heatmap",
          source: "heatmap",
          layout: { visibility: "none" },
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "price_per_m2"],
              10000, 0.2,
              30000, 0.6,
              50000, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              10, 0.5,
              14, 1.5,
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              10, 15,
              14, 35,
            ],
            "heatmap-opacity": 0.75,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(236,240,252,0)",
              0.1, "rgba(191,219,254,0.4)",
              0.3, "rgba(147,197,253,0.6)",
              0.5, "rgba(96,165,250,0.7)",
              0.7, "rgba(59,130,246,0.8)",
              0.9, "rgba(30,64,175,0.9)",
              1, "rgba(30,58,138,1)",
            ],
          },
        })

        // ── Hover interaction ──
        let hoveredId: number | null = null

        map.on("mousemove", "zones-fill", (e) => {
          if (!e.features?.length) return
          map.getCanvas().style.cursor = "pointer"

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
        })

        map.on("mouseleave", "zones-fill", () => {
          map.getCanvas().style.cursor = ""
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "zones", id: hoveredId },
              { hover: false }
            )
            hoveredId = null
          }
        })

        // ── Click interaction ──
        map.on("click", "zones-fill", (e) => {
          if (!e.features?.length) return
          const props = e.features[0].properties as {
            slug: string
            name: string
            priceLabel: string
            avgPrice: number
            totalListings: number
            priceTrend: number
          }

          if (onZoneClick) onZoneClick(props.slug)

          const centroid = getZoneCentroid(props.slug)
          if (centroid) {
            map.flyTo({ center: centroid, zoom: 14, duration: 800 })
          }

          const trendColor = props.priceTrend >= 0 ? "#16a34a" : "#dc2626"
          const trendIcon = props.priceTrend >= 0 ? "▲" : "▼"

          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 2px">
                <div style="font-weight:800;font-size:15px;color:#0f172a;margin-bottom:2px">${props.name}</div>
                <div style="display:inline-block;padding:2px 8px;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:700;border-radius:10px;margin-bottom:8px">${props.priceLabel}</div>
                <div style="font-size:18px;font-weight:800;color:#1e40af;margin-bottom:4px">${formatPrice(props.avgPrice)}<span style="font-size:12px;font-weight:500;color:#64748b">/m²</span></div>
                <div style="display:flex;gap:12px;font-size:11px;color:#475569;margin-bottom:4px">
                  <span>${getZoneActivityLabel(props.totalListings)}</span>
                  <span style="color:${trendColor};font-weight:600">${trendIcon} ${Math.abs(props.priceTrend).toFixed(1)}%</span>
                </div>
                <a href="/zona/${props.slug}" style="display:inline-block;margin-top:6px;padding:6px 12px;background:#1e40af;color:white;font-size:11px;font-weight:700;border-radius:6px;text-decoration:none">Ver análisis →</a>
              </div>`
            )
            .addTo(map)
        })

        // Focus on specific zone
        if (focusZoneSlug) {
          const centroid = getZoneCentroid(focusZoneSlug)
          if (centroid) {
            map.flyTo({ center: centroid, zoom: 14, duration: 800 })
          }
        }

        setMapLoaded(true)
      })
    })

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Toggle layer visibility
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    const zoneLayers = ["zones-glow", "zones-fill", "zones-line", "zones-labels"]
    const heatLayers = ["heatmap-heat"]

    if (activeLayer === "zones") {
      zoneLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "visible")
      )
      heatLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "none")
      )
    } else {
      zoneLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "none")
      )
      heatLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "visible")
      )
    }
  }, [activeLayer, mapLoaded])

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="bg-slate-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-slate-400 text-sm font-medium">
          Cargando mapa…
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ height }}
    >
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Layer toggle — pill style */}
      {showLayerToggle && (
        <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/80 p-1">
          {(["zones", "heatmap"] as LayerMode[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200 ${
                activeLayer === layer
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {layer === "zones" ? "Zonas" : "Heatmap"}
            </button>
          ))}
        </div>
      )}

      {/* Legend — gradient bar style */}
      <div className="absolute bottom-4 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 p-3 min-w-[140px]">
        <p className="text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
          Precio/m²
        </p>
        <div className="h-2 rounded-full mb-2" style={{
          background: "linear-gradient(to right, #bfdbfe, #93c5fd, #60a5fa, #3b82f6, #1e40af)"
        }} />
        <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
          <span>&lt;$20k</span>
          <span>$40k+</span>
        </div>
      </div>
    </div>
  )
}
