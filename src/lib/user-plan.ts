import { createSupabaseServerClient } from "./supabase-server"

export type UserPlan = "free" | "pro" | "business"

interface PlanInfo {
  plan: UserPlan
  userId: string
}

/**
 * Get the current user's plan. Returns null if not authenticated.
 */
export async function getUserPlan(): Promise<PlanInfo | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  return {
    plan: (profile?.plan as UserPlan) ?? "free",
    userId: user.id,
  }
}

/** Plan limits */
export const PLAN_LIMITS = {
  free: { brujula_per_month: 3, exports_per_month: 3 },
  pro: { brujula_per_month: 999_999, exports_per_month: 999_999 },
  business: { brujula_per_month: 999_999, exports_per_month: 999_999 },
} as const

/** Check if plan meets minimum requirement */
export function planMeetsRequirement(userPlan: UserPlan, required: UserPlan): boolean {
  const order: Record<UserPlan, number> = { free: 0, pro: 1, business: 2 }
  return order[userPlan] >= order[required]
}
