import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { ReactNode } from "react"

/**
 * Server-side auth check: renders children directly if authenticated,
 * or wraps in a blur div for anonymous users.
 * The client-side AuthBanner handles the CTA.
 */
export async function AuthGateServer({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return <>{children}</>

  return (
    <div className="relative" data-auth-gated>
      <div className="blur-[5px] select-none pointer-events-none">
        {children}
      </div>
    </div>
  )
}
