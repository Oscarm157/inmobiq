"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"
import { TrendingUp, TrendingDown, MapPin, Home, ArrowUpRight } from "lucide-react"
import type { ZoneMetrics } from "@/types/database"

interface ZoneCardProps {
  zone: ZoneMetrics
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const isPositive = zone.price_trend_pct > 0

  return (
    <Link href={`/zona/${zone.zone_slug}`} className="group">
      <Card className="h-full transition-all duration-200 hover:ring-2 hover:ring-primary/20 hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold leading-tight">
                {zone.zone_name}
              </CardTitle>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {formatCurrency(zone.avg_price_per_m2)}
              <span className="text-xs font-normal text-muted-foreground">/m²</span>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant={isPositive ? "default" : "destructive"}
              className="gap-1"
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(zone.price_trend_pct)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Ticket: {formatCurrency(zone.avg_ticket)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 text-xs text-muted-foreground">
            <Home className="h-3 w-3" />
            {formatNumber(zone.total_listings)} propiedades activas
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
