"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, MapPin, Home } from "lucide-react";
import type { ZoneMetrics } from "@/types/database";

interface ZoneCardProps {
  zone: ZoneMetrics;
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const isPositive = zone.price_trend_pct > 0;

  return (
    <Link href={`/zona/${zone.zone_slug}`}>
      <Card className="hover:shadow-lg hover:border-[var(--accent)] transition-all cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors">
                {zone.zone_name}
              </h3>
            </div>
            <Badge variant={isPositive ? "success" : "destructive"} className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(zone.price_trend_pct)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Precio x m²</p>
              <p className="text-lg font-bold">{formatCurrency(zone.avg_price_per_m2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Ticket promedio</p>
              <p className="text-lg font-bold">{formatCurrency(zone.avg_ticket)}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
              <Home className="h-3.5 w-3.5" />
              {formatNumber(zone.total_listings)} propiedades
            </div>
            <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalle →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
