"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import { Breadcrumb } from "@/components/breadcrumb"
import { HeroHeader } from "@/components/hero-header"
import { PERFIL_CONFIGS, PERFIL_KEYS, type PerfilType } from "@/lib/profiles"
import { COOKIE_PERFIL, setPreferredPerfil, setPreferredOperacion, setPreferredCategoria } from "@/lib/preference-cookies"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

interface UserProfile {
  perfil: PerfilType | null
  default_operacion: string | null
  default_categoria: string | null
  phone: string | null
  referral_source: string | null
}

export default function PerfilPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Fetch profile data from DB
  useEffect(() => {
    if (!user) return
    const supabase = createSupabaseBrowserClient()
    supabase
      .from("user_profiles")
      .select("perfil, default_operacion, default_categoria, phone, referral_source")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as UserProfile)
      })
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirectedFrom=/perfil")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Breadcrumb items={[{ label: "Perfil" }]} />
        <div className="flex flex-col items-center justify-center min-h-48 gap-3">
          <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Breadcrumb items={[{ label: "Perfil" }]} />
        <div className="flex flex-col items-center justify-center min-h-48 gap-3">
          <Icon name="login" className="text-3xl text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

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
      <Breadcrumb items={[{ label: "Perfil" }]} />
      {(() => {
        const joinDate = new Date(user.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
        return (
          <HeroHeader
            badge="Cuenta personal"
            badgeIcon="verified_user"
            title={<>{name}<br /><span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent text-2xl sm:text-3xl">{user.email}</span></>}
            subtitle={`Miembro desde ${joinDate} · Plan gratuito`}
            accent="blue"
            compact
            meta={
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.07] text-blue-300 text-[10px] font-bold rounded-full backdrop-blur-sm border border-white/[0.04] capitalize">
                <Icon name={provider === "google" ? "account_circle" : "mail"} className="text-xs" />
                {provider}
              </span>
            }
          />
        )
      })()}

      {/* Account details */}
      <div className="bg-surface rounded-2xl border border-border/50 card-shadow divide-y divide-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
              Correo electrónico
            </p>
            <p className="text-sm text-foreground font-medium">{user.email}</p>
          </div>
          <Icon name="email" className="text-muted-foreground/40 text-xl" />
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
              Miembro desde
            </p>
            <p className="text-sm text-foreground font-medium">
              {new Date(user.created_at).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Icon name="calendar_today" className="text-muted-foreground/40 text-xl" />
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
              Plan
            </p>
            <p className="text-sm text-foreground font-medium">Gratuito</p>
          </div>
          <Icon name="workspace_premium" className="text-muted-foreground/40 text-xl" />
        </div>
        {profile?.phone && (
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                Teléfono
              </p>
              <p className="text-sm text-foreground font-medium">{profile.phone}</p>
            </div>
            <Icon name="phone" className="text-muted-foreground/40 text-xl" />
          </div>
        )}
      </div>

      {/* Features unlocked */}
      <div className="bg-kpi-icon-blue rounded-2xl border border-primary/10 p-6">
        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
          <Icon name="lock_open" className="text-base" />
          Funciones desbloqueadas
        </h3>
        <ul className="space-y-2">
          {[
            "Guardar presets de portafolio",
            "Exportar reportes PDF/Excel",
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
              <Icon name="check_circle" className="text-green-500 dark:text-green-400 text-base" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Market profile selector */}
      <PerfilSelector />

      {/* Default filters */}
      <DefaultFiltersSelector profile={profile} onSaved={() => {
        // Re-fetch profile after saving defaults
        if (!user) return
        const supabase = createSupabaseBrowserClient()
        supabase.from("user_profiles").select("perfil, default_operacion, default_categoria, phone, referral_source").eq("id", user.id).single().then(({ data }) => { if (data) setProfile(data as UserProfile) })
      }} />

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        <Icon name="logout" className="text-base" />
        Cerrar sesión
      </button>
    </div>
  )
}

function PerfilSelector() {
  const [saved, setSaved] = useState<PerfilType | null>(null)
  const [selected, setSelected] = useState<PerfilType | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const router = useRouter()

  const hasChanges = selected !== null && selected !== saved

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_PERFIL}=([^;]*)`))
    const val = (match?.[1] as PerfilType) ?? null
    setSaved(val)
    setSelected(val)
  }, [])

  // Warn on browser navigation (close tab, reload, external link)
  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasChanges])

  const handleSave = useCallback(async () => {
    if (!selected || !hasChanges) return
    setSaving(true)
    const config = PERFIL_CONFIGS[selected]
    setPreferredPerfil(selected)
    setPreferredOperacion(config.defaultOperacion)
    setPreferredCategoria(config.defaultCategoria)

    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil: selected }),
      })
    } catch {}

    setSaved(selected)
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
    router.refresh()
  }, [selected, hasChanges, router])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
        <Icon name="tune" className="text-base" />
        Mi Perfil de Mercado
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Personaliza que datos e indicadores ves primero.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PERFIL_KEYS.map((key) => {
          const config = PERFIL_CONFIGS[key]
          const isActive = selected === key
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
                <Icon name={config.icon} className="text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{config.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{config.description}</p>
              </div>
              {isActive && (
                <Icon name="check_circle" className="text-blue-500 text-base ml-auto flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Save button + unsaved indicator */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasChanges
              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          <Icon name={justSaved ? "check" : "save"} className="text-base" />
          {saving ? "Guardando..." : justSaved ? "Guardado" : "Guardar cambios"}
        </button>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Icon name="warning" className="text-sm" />
            Cambios sin guardar
          </span>
        )}
      </div>
    </div>
  )
}

function DefaultFiltersSelector({ profile, onSaved }: { profile: UserProfile | null; onSaved: () => void }) {
  const perfilConfig = profile?.perfil ? PERFIL_CONFIGS[profile.perfil] : null

  const [operacion, setOperacion] = useState<string>("")
  const [categoria, setCategoria] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Initialize from profile data
  useEffect(() => {
    if (!profile) return
    setOperacion(profile.default_operacion ?? "")
    setCategoria(profile.default_categoria ?? "")
  }, [profile])

  const savedOp = profile?.default_operacion ?? ""
  const savedCat = profile?.default_categoria ?? ""
  const hasChanges = operacion !== savedOp || categoria !== savedCat

  const handleSave = useCallback(async () => {
    if (!hasChanges) return
    setSaving(true)
    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_operacion: operacion || null,
          default_categoria: categoria || null,
        }),
      })
    } catch {}
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
    onSaved()
  }, [operacion, categoria, hasChanges, onSaved])

  const opLabel = (v: string) => {
    if (v === "venta") return "Venta"
    if (v === "renta") return "Renta"
    return perfilConfig ? `Del perfil (${perfilConfig.defaultOperacion})` : "Venta"
  }
  const catLabel = (v: string) => {
    if (v === "residencial") return "Residencial"
    if (v === "comercial") return "Comercial"
    if (v === "terreno") return "Terreno"
    return perfilConfig ? `Del perfil (${perfilConfig.defaultCategoria})` : "Residencial"
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
        <Icon name="filter_alt" className="text-base" />
        Filtros por defecto
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Al iniciar sesión, las zonas se mostrarán con estos filtros. Puedes cambiarlos en cualquier momento dentro de cada zona.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Operación
          </label>
          <div className="flex flex-col gap-1.5">
            {["", "venta", "renta"].map((v) => (
              <button
                key={v}
                onClick={() => setOperacion(v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  operacion === v
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {operacion === v && <Icon name="check" className="text-sm text-blue-500" />}
                {opLabel(v)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Categoría
          </label>
          <div className="flex flex-col gap-1.5">
            {["", "residencial", "comercial", "terreno"].map((v) => (
              <button
                key={v}
                onClick={() => setCategoria(v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  categoria === v
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {categoria === v && <Icon name="check" className="text-sm text-blue-500" />}
                {catLabel(v)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasChanges
              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          <Icon name={justSaved ? "check" : "save"} className="text-base" />
          {saving ? "Guardando..." : justSaved ? "Guardado" : "Guardar cambios"}
        </button>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Icon name="warning" className="text-sm" />
            Cambios sin guardar
          </span>
        )}
      </div>
    </div>
  )
}
