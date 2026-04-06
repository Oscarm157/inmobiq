import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { ReactNode } from "react"

/**
 * Server-side section gate: title is always visible, content is blurred for anonymous users.
 * Use this to wrap individual sections where the heading should remain readable.
 */
export async function AuthGatedSection({
  title,
  children,
  blur = 3,
}: {
  title?: ReactNode
  children: ReactNode
  blur?: number
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return (
      <>
        {title}
        {children}
      </>
    )
  }

  return (
    <div data-auth-gated>
      {title}
      <div className="select-none pointer-events-none" style={{ filter: `blur(${blur}px)` }}>
        {children}
      </div>
    </div>
  )
}
