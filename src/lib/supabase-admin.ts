import { createClient } from "@supabase/supabase-js"

/**
 * Service-role client — bypasses RLS.
 * Only use server-side in API routes where access control is handled at the application layer.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
