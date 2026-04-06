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
  overlay = false,
}: {
  title?: ReactNode
  children: ReactNode
  blur?: number
  /** Use semi-transparent overlay instead of blur (for light-on-light content that disappears with blur) */
  overlay?: boolean
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

  if (overlay) {
    return (
      <div data-auth-gated>
        {title}
        <div className="relative select-none pointer-events-none">
          <div className="opacity-40">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/80 rounded-xl" />
        </div>
      </div>
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
