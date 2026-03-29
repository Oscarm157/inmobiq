"use client"

import { Icon } from "@/components/icon"
import type { ZoneMetrics } from "@/types/database"

interface VerdictBannerProps {
  zones: ZoneMetrics[]
  colors: string[]
}

interface CategoryWinner {
  label: string
  slug: string
}

function getVerdict(zones: ZoneMetrics[]): { winnerSlug: string; strengths: CategoryWinner[] } | null {
  if (zones.length < 2) return null

  const wins: Record<string, CategoryWinner[]> = {}
  for (const z of zones) wins[z.zone_slug] = []

  // Best trend
  const bestTrend = [...zones].sort((a, b) => b.price_trend_pct - a.price_trend_pct)[0]
  if (bestTrend.price_trend_pct > 0) {
    wins[bestTrend.zone_slug].push({ label: "Mejor tendencia", slug: bestTrend.zone_slug })
  }

  // Most listings (liquidity)
  const mostListings = [...zones].sort((a, b) => b.total_listings - a.total_listings)[0]
  if (mostListings.total_listings > 0) {
    wins[mostListings.zone_slug].push({ label: "Mayor liquidez", slug: mostListings.zone_slug })
  }

  // Best value (lowest price/m2)
  const bestValue = [...zones].sort((a, b) => a.avg_price_per_m2 - b.avg_price_per_m2)[0]
  if (bestValue.avg_price_per_m2 > 0) {
    wins[bestValue.zone_slug].push({ label: "Mejor valor/m²", slug: bestValue.zone_slug })
  }

  // Highest ticket (premium)
  const highTicket = [...zones].sort((a, b) => b.avg_ticket - a.avg_ticket)[0]
  if (highTicket.avg_ticket > 0) {
    wins[highTicket.zone_slug].push({ label: "Mayor ticket", slug: highTicket.zone_slug })
  }

  // Find who has the most wins
  const sorted = Object.entries(wins).sort(([, a], [, b]) => b.length - a.length)
  const [winnerSlug, strengths] = sorted[0]
  if (strengths.length === 0) return null

  return { winnerSlug, strengths }
}

export function VerdictBanner({ zones, colors }: VerdictBannerProps) {
  const verdict = getVerdict(zones)
  if (!verdict) return null

  const winnerIndex = zones.findIndex((z) => z.zone_slug === verdict.winnerSlug)
  const winner = zones[winnerIndex]
  const winnerColor = colors[winnerIndex] ?? "#2563eb"

  const strengthLabels = verdict.strengths.map((s) => s.label)
  const text = `${winner.zone_name} destaca en ${strengthLabels.join(" y ").toLowerCase()}`

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-r-xl gap-4"
      style={{ borderLeftWidth: "4px", borderLeftColor: winnerColor }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${winnerColor}15`, color: winnerColor }}
        >
          <Icon name="star" className="text-lg" />
        </div>
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">{text}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Basado en los datos actuales del mercado</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {verdict.strengths.map((s) => (
          <span
            key={s.label}
            className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: `${winnerColor}15`,
              color: winnerColor,
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
