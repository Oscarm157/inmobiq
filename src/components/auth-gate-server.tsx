import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AuthGate } from "./auth-gate"
import type { ReactNode } from "react"

/**
 * Server-side auth gate: checks if user is logged in on the server,
 * renders children directly if yes, or wraps in AuthGate blur if no.
 * Use this in Server Components where useAuth() is not available.
 */
export async function AuthGateServer({
  children,
  message,
}: {
  children: ReactNode
  message?: string
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return <>{children}</>

  return <AuthGate message={message}>{children}</AuthGate>
}
