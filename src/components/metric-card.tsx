"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, subtitle, icon }: MetricCardProps) {
  const trendVariant = trend !== undefined
    ? trend > 0 ? "success" : trend < 0 ? "destructive" : "default"
    : undefined;

  const TrendIcon = trend !== undefined
    ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div className="text-[var(--muted-foreground)]">{icon}</div>
            )}
            {trend !== undefined && trendVariant && TrendIcon && (
              <Badge variant={trendVariant} className="flex items-center gap-1">
                <TrendIcon className="h-3 w-3" />
                {formatPercent(trend)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
