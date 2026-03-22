import { createSupabaseServerClient } from "./supabase-server";
import type { UserRole } from "@/types/database";

interface AdminCheckResult {
  isAdmin: true;
  userId: string;
}

interface AdminCheckError {
  isAdmin: false;
  error: string;
  status: number;
}

/**
 * Verify the current user is authenticated and has admin role.
 * Use in API routes: const check = await verifyAdmin(); if (!check.isAdmin) return ...
 */
export async function verifyAdmin(): Promise<AdminCheckResult | AdminCheckError> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: "No autenticado", status: 401 };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = ((profile as { role: string } | null)?.role ?? "user") as UserRole;

  if (role !== "admin") {
    return { isAdmin: false, error: "Acceso denegado", status: 403 };
  }

  return { isAdmin: true, userId: user.id };
}
