"use client"

import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import Link from "next/link"
import type { ReactNode } from "react"

interface AuthGateProps {
  children: ReactNode
  /** What to show in the CTA. Default: register prompt */
  message?: string
  /** Show a compact inline gate instead of full overlay */
  inline?: boolean
}

/**
 * For anonymous users: renders children with a gradient blur overlay + CTA.
 * The first ~20% of content is visible, the rest fades into blur.
 * Authenticated users see everything normally.
 */
export function AuthGate({ children, message, inline }: AuthGateProps) {
  const { user, loading } = useAuth()

  // Authenticated — render normally
  if (loading || user) return <>{children}</>

  if (inline) {
    return (
      <div className="relative">
        <div className="blur-[6px] select-none pointer-events-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Icon name="lock" className="text-sm" />
            {message ?? "Regístrate gratis para ver"}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Real content — visible at top, fades into blur */}
      <div className="relative overflow-hidden">
        {children}
        {/* Gradient mask: transparent at top → white at bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 15%, var(--color-background) 55%)",
          }}
        />
      </div>

      {/* CTA overlay positioned over the blurred area */}
      <div className="relative -mt-32 pt-8 pb-10 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-inset flex items-center justify-center">
          <Icon name="lock" className="text-xl text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">
            {message ?? "Crea tu cuenta gratis para ver todos los datos"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Accede a métricas de mercado, análisis por zona y herramientas de valuación
          </p>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
        >
          <Icon name="person_add" className="text-base" />
          Crear cuenta gratis
        </Link>
        <p className="text-xs text-muted-foreground">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-500 hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

/**
 * For plan-gated features: shows upgrade CTA when user is on free plan.
 */
interface PlanGateProps {
  children: ReactNode
  /** Required plan level */
  requiredPlan?: "pro" | "business"
  /** Current user plan */
  userPlan?: string
  /** Feature name for the CTA */
  feature?: string
}

export function PlanGate({ children, requiredPlan = "pro", userPlan, feature }: PlanGateProps) {
  const planOrder = { free: 0, pro: 1, business: 2 }
  const current = planOrder[userPlan as keyof typeof planOrder] ?? 0
  const required = planOrder[requiredPlan]

  if (current >= required) return <>{children}</>

  return (
    <div className="relative">
      <div className="blur-[6px] select-none pointer-events-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/precios"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Icon name="star" className="text-sm" />
          {feature ? `Actualiza a ${requiredPlan === "business" ? "Business" : "Pro"} para ${feature}` : `Actualiza tu plan`}
        </Link>
      </div>
    </div>
  )
}
