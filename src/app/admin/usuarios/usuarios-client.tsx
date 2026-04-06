"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

interface UserRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "user" | "admin"
  perfil: string | null
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
  valuation_count: number
}

const PERFIL_LABELS: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  arrendador: "Inversionista",
  broker: "Broker",
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-MX", { month: "short", day: "numeric" })
}

export function UsuariosClient() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [search, setSearch] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Error cargando usuarios")
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    if (!isAdmin) {
      router.push("/")
      return
    }
    fetchUsers()
  }, [user, isAdmin, router, fetchUsers])

  const updateUser = async (userId: string, updates: { is_active?: boolean; role?: "user" | "admin" }) => {
    setUpdating(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      )
    } catch {
      setError("Error actualizando usuario")
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter((u) => {
    if (filter === "active" && !u.is_active) return false
    if (filter === "inactive" && u.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        u.email.toLowerCase().includes(q) ||
        (u.full_name?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    withValuations: users.filter((u) => u.valuation_count > 0).length,
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-surface-inset rounded animate-pulse" />
        <div className="h-64 bg-surface-inset rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de usuarios y actividad de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: "group", color: "text-blue-500" },
          { label: "Activos", value: stats.active, icon: "check_circle", color: "text-green-500" },
          { label: "Admins", value: stats.admins, icon: "admin_panel_settings", color: "text-amber-500" },
          { label: "Con valuaciones", value: stats.withValuations, icon: "explore", color: "text-violet-500" },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={s.icon} className={`text-base ${s.color}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
          <Icon name="error" className="text-red-500 text-base" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <Icon name="close" className="text-base" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="flex gap-1 bg-surface-inset rounded-lg p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                filter === f
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-surface rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Perfil</th>
                <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Valuaciones</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Registro</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Último acceso</th>
                <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === user?.id
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border/50 last:border-0 ${!u.is_active ? "opacity-50" : ""}`}
                  >
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center flex-shrink-0">
                            <Icon name="person" className="text-muted-foreground text-sm" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                            {u.full_name || u.email.split("@")[0]}
                            {isSelf && <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-black">TÚ</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Perfil */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {u.perfil ? PERFIL_LABELS[u.perfil] ?? u.perfil : "—"}
                      </span>
                    </td>

                    {/* Valuations */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className={`text-xs font-bold ${u.valuation_count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {u.valuation_count}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>

                    {/* Last sign in */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(u.last_sign_in_at)}
                      </span>
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={isSelf || updating === u.id}
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          u.is_active
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        title={isSelf ? "No puedes desactivarte a ti mismo" : u.is_active ? "Desactivar usuario" : "Activar usuario"}
                      >
                        <Icon name={u.is_active ? "check_circle" : "cancel"} className="text-xs" />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>

                    {/* Role toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={isSelf || updating === u.id}
                        onClick={() => updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          u.role === "admin"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                            : "bg-surface-inset text-muted-foreground hover:bg-border"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        title={isSelf ? "No puedes quitarte el rol de admin" : u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                      >
                        <Icon name={u.role === "admin" ? "admin_panel_settings" : "person"} className="text-xs" />
                        {u.role === "admin" ? "Admin" : "User"}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
