"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

function LoginForm() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/"
  const urlError = searchParams.get("error")

  const [mode, setMode] = useState<"login" | "register" | "reset">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(urlError)
  const [success, setSuccess] = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    await signInWithGoogle(redirectedFrom)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === "reset") {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error)
      } else {
        setSuccess("Revisa tu correo para restablecer tu contraseña.")
      }
      setLoading(false)
      return
    }

    if (mode === "login") {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        setError(error)
        setLoading(false)
      } else {
        router.push(redirectedFrom)
        router.refresh()
      }
    } else {
      const { error } = await signUpWithEmail(email, password)
      if (error) {
        setError(error)
      } else {
        setSuccess("Revisa tu correo para confirmar tu cuenta.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Layer 1: Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #020617 0%, #0c2461 25%, #0a1628 50%, #0d3b4f 75%, #020617 100%)",
          backgroundSize: "300% 300%",
          animation: "login-gradient-shift 15s ease infinite",
        }}
      />

      {/* Layer 2: Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          animation: "login-grid-fade 8s ease-in-out infinite",
        }}
      />

      {/* Layer 3: Floating geometric shapes */}
      <div
        className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full border border-blue-400/10 bg-blue-500/5 blur-[2px] hidden sm:block"
        style={{ animation: "login-float-1 25s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[60%] right-[8%] w-48 h-48 rounded-full border border-cyan-400/10 bg-cyan-500/5 blur-[2px] hidden sm:block"
        style={{ animation: "login-float-2 30s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[20%] right-[15%] w-32 h-32 rotate-45 rounded-xl border border-cyan-400/10 bg-cyan-500/5 blur-[1px]"
        style={{ animation: "login-float-3 20s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[15%] left-[12%] w-24 h-24 rounded-full border border-blue-400/8 bg-blue-500/5 blur-[1px]"
        style={{ animation: "login-float-2 22s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[45%] left-[60%] w-16 h-16 rotate-12 rounded-lg border border-blue-400/10 bg-blue-500/5 blur-[1px] hidden sm:block"
        style={{ animation: "login-float-1 35s ease-in-out infinite" }}
      />

      {/* Layer 4: Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.7) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div
          className="text-center mb-8"
          style={{ animation: "login-slide-up 0.6s ease-out" }}
        >
          <Image
            src="/logo-inmobiq-white.png"
            alt="Inmobiq"
            width={220}
            height={48}
            className="mx-auto mb-3 w-[180px] sm:w-[220px] h-auto"
            priority
          />
          <p className="text-blue-400/80 text-sm font-medium uppercase tracking-[0.25em]">
            Inteligencia Inmobiliaria
          </p>
        </div>

        {/* Card with glow effect */}
        <div
          className="relative"
          style={{ animation: "login-slide-up 0.7s ease-out 0.1s both" }}
        >
          {/* Glow border */}
          <div
            className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20 blur-sm"
            style={{ animation: "login-glow-pulse 4s ease-in-out infinite" }}
          />

          {/* Glass card */}
          <div className="relative bg-slate-950/60 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            <div key={mode} style={{ animation: "login-slide-up 0.3s ease-out" }}>
              <h2 className="text-xl font-bold text-white mb-6 text-center">
                {mode === "login"
                  ? "Iniciar sesión"
                  : mode === "register"
                  ? "Crear cuenta"
                  : "Recuperar contraseña"}
              </h2>

              {/* Google OAuth */}
              {mode !== "reset" && (
                <>
                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl hover:bg-slate-100 transition-all duration-300 disabled:opacity-60 mb-6 shadow-lg shadow-white/5"
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.022 35.392 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                    </svg>
                    Continuar con Google
                  </button>

                  <div className="relative flex items-center mb-6">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="mx-3 text-white/40 text-xs font-medium uppercase tracking-wider">
                      o con correo
                    </span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>
                </>
              )}

              {/* Email/Password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200/80 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/30 focus:bg-white/[0.08] transition-all duration-300"
                  />
                </div>
                {mode !== "reset" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-200/80 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/30 focus:bg-white/[0.08] transition-all duration-300"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-300 text-sm bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                    <Icon name="error_outline" className="text-base" />
                    <span>{error === "auth_callback_failed" ? "Error de autenticación. Inténtalo de nuevo." : error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-300 text-sm bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
                    <Icon name="check_circle_outline" className="text-base" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-60 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {loading
                    ? "Cargando..."
                    : mode === "reset"
                    ? "Enviar enlace de recuperación"
                    : mode === "login"
                    ? "Iniciar sesión"
                    : "Crear cuenta"}
                </button>
              </form>

              <div className="mt-4 text-center space-y-2">
                {mode === "login" && (
                  <button
                    onClick={() => { setMode("reset"); setError(null); setSuccess(null) }}
                    className="block w-full text-white/40 hover:text-white/70 text-xs transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-cyan-400/80 hover:text-cyan-300 text-sm transition-colors"
                >
                  {mode === "reset"
                    ? "Volver a iniciar sesión"
                    : mode === "login"
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p
          className="text-center text-white/20 text-xs mt-6"
          style={{ animation: "login-slide-up 0.8s ease-out 0.2s both" }}
        >
          Tijuana · Mercado Inmobiliario · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}>
        <span className="text-white/50">Cargando...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
