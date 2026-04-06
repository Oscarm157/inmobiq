"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"

// Generate a session ID that persists across page navigations but resets on tab close
function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem("inmobiq_sid")
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem("inmobiq_sid", id)
  }
  return id
}

function sendEvent(
  eventType: string,
  eventName: string,
  metadata?: Record<string, unknown>,
) {
  const sessionId = getSessionId()
  if (!sessionId) return

  // Use sendBeacon for reliability (survives page unload)
  const body = JSON.stringify({
    session_id: sessionId,
    event_type: eventType,
    event_name: eventName,
    metadata,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body)
  } else {
    fetch("/api/analytics", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {})
  }
}

/**
 * Hook: auto-tracks pageviews and provides trackEvent for manual feature tracking.
 * Place in your root layout client wrapper.
 */
export function useAnalytics() {
  const pathname = usePathname()
  const enterTime = useRef(Date.now())

  // Track pageview on route change
  useEffect(() => {
    enterTime.current = Date.now()
    sendEvent("pageview", pathname)
  }, [pathname])

  // Track session duration on page leave
  useEffect(() => {
    const handleUnload = () => {
      const duration = Date.now() - enterTime.current
      sendEvent("pageview", pathname, { duration_ms: duration, exit: true })
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [pathname])

  // Manual tracking for features
  const trackEvent = useCallback(
    (eventType: string, eventName: string, metadata?: Record<string, unknown>) => {
      sendEvent(eventType, eventName, metadata)
    },
    [],
  )

  return { trackEvent }
}
