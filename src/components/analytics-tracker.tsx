"use client"

import { useAnalytics } from "@/hooks/use-analytics"

/**
 * Invisible component that tracks pageviews automatically.
 * Place inside the client provider tree in layout.tsx.
 */
export function AnalyticsTracker() {
  useAnalytics()
  return null
}
