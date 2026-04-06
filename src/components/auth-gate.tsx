"use client"

import { useAuth } from "@/contexts/auth-context"
import type { ReactNode } from "react"

/**
 * Inline auth gate: blurs a single section for anonymous users.
 * No CTA — the global AuthBanner handles that.
 * Marks the element with data-auth-gated for the banner's IntersectionObserver.
 */
export function AuthGateInline({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading || user) return <>{children}</>

  return (
    <div className="relative" data-auth-gated>
      <div className="blur-[3px] select-none pointer-events-none">
        {children}
      </div>
    </div>
  )
}

/**
 * Server-compatible auth gate for wrapping large sections.
 * Kept for backwards compat — prefer AuthGateInline for granular gating.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return <AuthGateInline>{children}</AuthGateInline>
}

/**
 * For plan-gated features: shows upgrade CTA when user is on free plan.
 */
interface PlanGateProps {
  children: ReactNode
  requiredPlan?: "pro" | "business"
  userPlan?: string
  feature?: string
}

export function PlanGate({ children, requiredPlan = "pro", userPlan, feature }: PlanGateProps) {
  const planOrder = { free: 0, pro: 1, business: 2 }
  const current = planOrder[userPlan as keyof typeof planOrder] ?? 0
  const required = planOrder[requiredPlan]

  if (current >= required) return <>{children}</>

  return (
    <div className="relative" data-auth-gated>
      <div className="blur-[3px] select-none pointer-events-none opacity-50">
        {children}
      </div>
    </div>
  )
}
