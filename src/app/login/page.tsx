"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

function LoginForm() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/"
  const urlError = searchParams.get("error")

  const [mode, setMode] = useState<"login" | "register">("login")
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

    if (mode === "login") {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        setError(error)
        setLoading(false)
      }
      // On success, middleware/router handles redirect
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Inmobiq</h1>
          <p className="text-blue-300 text-sm mt-1 font-medium uppercase tracking-widest">
            Inteligencia Inmobiliaria
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60 mb-6"
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
            <div className="flex-1 border-t border-white/20" />
            <span className="mx-3 text-white/50 text-xs font-medium uppercase tracking-wider">
              o con correo
            </span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-300 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                <Icon name="error_outline" className="text-base" />
                <span>{error === "auth_callback_failed" ? "Error de autenticación. Inténtalo de nuevo." : error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-300 text-sm bg-green-500/10 rounded-lg px-3 py-2">
                <Icon name="check_circle_outline" className="text-base" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading
                ? "Cargando..."
                : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login")
                setError(null)
                setSuccess(null)
              }}
              className="text-blue-300 hover:text-white text-sm transition-colors"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Tijuana · Mercado Inmobiliario · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-blue-950 flex items-center justify-center"><span className="text-white">Cargando...</span></div>}>
      <LoginForm />
    </Suspense>
  )
}
