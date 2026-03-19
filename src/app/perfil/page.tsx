"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

export default function PerfilPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirectedFrom=/perfil")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500 text-sm">Cargando perfil...</div>
      </div>
    )
  }

  if (!user) return null

  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Usuario"

  const avatar =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null

  const provider = user.app_metadata?.provider ?? "email"

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>

      {/* Avatar + info card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={72}
              height={72}
              className="rounded-full ring-2 ring-blue-100"
            />
          ) : (
            <div className="w-18 h-18 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon name="person" className="text-4xl text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{name}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
              <Icon name={provider === "google" ? "account_circle" : "mail"} className="text-sm" />
              {provider}
            </span>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Correo electrónico
            </p>
            <p className="text-sm text-slate-900 font-medium">{user.email}</p>
          </div>
          <Icon name="email" className="text-slate-300 text-xl" />
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Miembro desde
            </p>
            <p className="text-sm text-slate-900 font-medium">
              {new Date(user.created_at).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Icon name="calendar_today" className="text-slate-300 text-xl" />
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Plan
            </p>
            <p className="text-sm text-slate-900 font-medium">Gratuito</p>
          </div>
          <Icon name="workspace_premium" className="text-slate-300 text-xl" />
        </div>
      </div>

      {/* Features unlocked */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Icon name="lock_open" className="text-base" />
          Funciones desbloqueadas
        </h3>
        <ul className="space-y-2">
          {[
            "Guardar presets de portafolio",
            "Configurar alertas de precio",
            "Exportar reportes PDF/Excel",
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-blue-800">
              <Icon name="check_circle" className="text-green-500 text-base" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        <Icon name="logout" className="text-base" />
        Cerrar sesión
      </button>
    </div>
  )
}
