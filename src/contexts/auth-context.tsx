"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, metadata?: { phone?: string; referral_source?: string }) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const hasSupabaseConfig =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [isAdmin, setIsAdmin] = useState(false)
  // Lazy-init: create client only when Supabase env vars are present
  const [supabase] = useState(() =>
    hasSupabaseConfig ? createSupabaseBrowserClient() : null
  )

  const refreshAdminStatus = useCallback(async (user: User | null) => {
    if (!supabase || !user) {
      setIsAdmin(false)
      return
    }

    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      setIsAdmin((data as { role: string } | null)?.role === "admin")
    } catch {
      setIsAdmin(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      void refreshAdminStatus(session?.user ?? null)
    }).catch(() => {
      if (!active) return
      setLoading(false)
      setIsAdmin(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      void refreshAdminStatus(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, refreshAdminStatus])

  const signInWithGoogle = async (redirectTo?: string) => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`,
      },
    })
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase no configurado" }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { phone?: string; referral_source?: string }
  ) => {
    if (!supabase) return { error: "Supabase no configurado" }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          ...(metadata?.phone ? { phone: metadata.phone } : {}),
          ...(metadata?.referral_source ? { referral_source: metadata.referral_source } : {}),
        },
      },
    })
    return { error: error?.message ?? null }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: "Supabase no configurado" }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
