"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { setPreferredCategoria, setPreferredOperacion } from "@/lib/preference-cookies"

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
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

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("role, preferred_categoria, preferred_operacion")
          .eq("id", session.user.id)
          .single()
        const profile = data as { role: string; preferred_categoria?: string; preferred_operacion?: string } | null
        setIsAdmin(profile?.role === "admin")
        // Sync DB preferences → cookies
        if (profile?.preferred_categoria) setPreferredCategoria(profile.preferred_categoria)
        if (profile?.preferred_operacion) setPreferredOperacion(profile.preferred_operacion)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("role, preferred_categoria, preferred_operacion")
          .eq("id", session.user.id)
          .single()
        const profile = data as { role: string; preferred_categoria?: string; preferred_operacion?: string } | null
        setIsAdmin(profile?.role === "admin")
        // Sync DB preferences → cookies on login
        if (profile?.preferred_categoria) setPreferredCategoria(profile.preferred_categoria)
        if (profile?.preferred_operacion) setPreferredOperacion(profile.preferred_operacion)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

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

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase no configurado" }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
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
