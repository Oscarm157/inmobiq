"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

/**
 * Auth modal — login/register/reset as an overlay.
 * Listens for 'inmobiq:auth-modal' custom event to open.
 * Closes on successful auth or user dismiss.
 */
export function AuthModal() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"login" | "register" | "reset">("register")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [referralSource, setReferralSource] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Listen for open event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setMode(detail?.mode ?? "register")
      setOpen(true)
      setError(null)
      setSuccess(null)
      setEmail("")
      setPassword("")
      setPhone("")
      setReferralSource("")
    }
    window.addEventListener("inmobiq:auth-modal", handler)
    return () => window.removeEventListener("inmobiq:auth-modal", handler)
  }, [])

  // Close on successful auth
  useEffect(() => {
    if (user && open) {
      setOpen(false)
      router.refresh()
    }
  }, [user, open, router])

  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    await signInWithGoogle("/")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === "reset") {
      const { error } = await resetPassword(email)
      if (error) setError(error)
      else setSuccess("Revisa tu correo para restablecer tu contraseña.")
      setLoading(false)
      return
    }

    if (mode === "login") {
      const { error } = await signInWithEmail(email, password)
      if (error) { setError(error); setLoading(false) }
      // success handled by useEffect watching `user`
    } else {
      const { error } = await signUpWithEmail(email, password, {
        phone: phone || undefined,
        referral_source: referralSource || undefined,
      })
      if (error) setError(error)
      else setSuccess("Revisa tu correo para confirmar tu cuenta.")
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-400/15 to-blue-500/20 blur-sm" />

        {/* Card */}
        <div className="relative bg-slate-950/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1.5 text-white/30 hover:text-white/60 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Icon name="close" className="text-lg" />
          </button>

          <h2 className="text-xl font-bold text-white mb-1 text-center">
            {mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta gratis" : "Recuperar contraseña"}
          </h2>
          <p className="text-xs text-white/40 text-center mb-6">
            {mode === "register" ? "Accede a toda la inteligencia de mercado" : mode === "login" ? "Bienvenido de vuelta" : "Te enviaremos un enlace"}
          </p>

          {/* Google OAuth */}
          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-60 mb-5 shadow-lg shadow-white/5"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                  <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                  <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.022 35.392 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                </svg>
                Continuar con Google
              </button>

              <div className="relative flex items-center mb-5">
                <div className="flex-1 border-t border-white/10" />
                <span className="mx-3 text-white/30 text-[10px] font-medium uppercase tracking-wider">o con correo</span>
                <div className="flex-1 border-t border-white/10" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
            />
            {mode !== "reset" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
              />
            )}
            {mode === "register" && (
              <>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                />
                <select
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="" className="text-white/30">¿Cómo nos encontraste?</option>
                  <option value="google">Google</option>
                  <option value="redes_sociales">Redes sociales</option>
                  <option value="recomendacion">Recomendación</option>
                  <option value="otro">Otro</option>
                </select>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-300 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                <Icon name="error_outline" className="text-sm" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-300 text-xs bg-green-500/10 rounded-lg px-3 py-2">
                <Icon name="check_circle" className="text-sm" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-blue-600/25"
            >
              {loading ? "Cargando..." : mode === "reset" ? "Enviar enlace" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-4 text-center space-y-1.5">
            {mode === "login" && (
              <button onClick={() => { setMode("reset"); setError(null); setSuccess(null) }} className="block w-full text-white/30 hover:text-white/60 text-[11px] transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            )}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null) }}
              className="text-blue-400/80 hover:text-blue-300 text-sm transition-colors"
            >
              {mode === "reset" ? "Volver" : mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Helper to open the auth modal from anywhere */
export function openAuthModal(mode: "login" | "register" = "register") {
  window.dispatchEvent(new CustomEvent("inmobiq:auth-modal", { detail: { mode } }))
}
