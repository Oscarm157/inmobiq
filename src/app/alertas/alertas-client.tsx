"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import { getAlerts, createAlert, toggleAlert, deleteAlert } from "@/lib/data/alerts"
import { useCurrency } from "@/contexts/currency-context"
import type { PriceAlert, ConditionType, ZoneMetrics } from "@/types/database"

const CONDITION_LABELS: Record<ConditionType, string> = {
  price_drop: "Caída de precio (%)",
  price_below: "Precio por debajo de ($/m²)",
  new_listing: "Nuevo listing",
  inventory_change: "Cambio de inventario (%)",
}

const CONDITION_UNITS: Record<ConditionType, string> = {
  price_drop: "%",
  price_below: "$/m²",
  new_listing: "",
  inventory_change: "%",
}

const PROPERTY_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local" },
  { value: "oficina", label: "Oficina" },
]

const LISTING_TYPES = [
  { value: "", label: "Venta y renta" },
  { value: "venta", label: "Venta" },
  { value: "renta", label: "Renta" },
]

interface AlertasClientProps {
  zones: ZoneMetrics[]
}

export function AlertasClient({ zones }: AlertasClientProps) {
  const { formatPrice } = useCurrency()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    zone_id: "",
    property_type: "",
    listing_type: "",
    condition_type: "price_below" as ConditionType,
    threshold_value: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/alertas")
    }
  }, [user, loading, router])

  const fetchAlerts = useCallback(async () => {
    if (!user) return
    try {
      const data = await getAlerts(user.id)
      setAlerts(data)
    } catch {
      setError("No se pudieron cargar las alertas.")
    } finally {
      setLoadingAlerts(false)
    }
  }, [user])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleToggle = async (alert: PriceAlert) => {
    try {
      await toggleAlert(alert.id, !alert.is_active)
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, is_active: !a.is_active } : a))
      )
    } catch {
      setError("No se pudo actualizar la alerta.")
    }
  }

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch {
      setError("No se pudo eliminar la alerta.")
    }
  }

  const handleCreate = async () => {
    if (!user) return
    setError(null)
    setSaving(true)
    try {
      const threshold = parseFloat(form.threshold_value)
      if (form.condition_type !== "new_listing" && (isNaN(threshold) || threshold <= 0)) {
        setError("Ingresa un umbral válido.")
        setSaving(false)
        return
      }
      const newAlert = await createAlert(user.id, {
        zone_id: form.zone_id || null,
        property_type: form.property_type || null,
        listing_type: form.listing_type || null,
        condition_type: form.condition_type,
        threshold_value: form.condition_type === "new_listing" ? 0 : threshold,
      })
      setAlerts((prev) => [newAlert, ...prev])
      setShowForm(false)
      setForm({
        zone_id: "",
        property_type: "",
        listing_type: "",
        condition_type: "price_below",
        threshold_value: "",
      })
    } catch {
      setError("No se pudo crear la alerta.")
    } finally {
      setSaving(false)
    }
  }

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return "Todas las zonas"
    return zones.find((z) => z.zone_id === zoneId)?.zone_name ?? zoneId
  }

  const formatCondition = (alert: PriceAlert) => {
    if (alert.condition_type === "new_listing") return "Nuevo listing disponible"
    const unit = CONDITION_UNITS[alert.condition_type]
    if (alert.condition_type === "price_below") {
      return `Precio por debajo de: ${formatPrice(alert.threshold_value)}/m²`
    }
    return `${CONDITION_LABELS[alert.condition_type].replace(` (${unit})`, "")}: ${alert.threshold_value}${unit}`
  }

  if (loading || (!user && !loading)) {
    return null
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Mis Alertas</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Recibe notificaciones cuando cambien precios o aparezcan nuevas propiedades.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-full text-sm font-bold shadow hover:bg-slate-900 transition-colors"
        >
          <Icon name={showForm ? "close" : "add"} className="text-base" />
          {showForm ? "Cancelar" : "Nueva alerta"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 shadow-sm">
          <h3 className="font-bold text-lg">Nueva alerta de precio</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Zona
              </label>
              <select
                value={form.zone_id}
                onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todas las zonas</option>
                {zones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.zone_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Tipo de condición
              </label>
              <select
                value={form.condition_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, condition_type: e.target.value as ConditionType }))
                }
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Tipo de propiedad
              </label>
              <select
                value={form.property_type}
                onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Tipo de listado
              </label>
              <select
                value={form.listing_type}
                onChange={(e) => setForm((f) => ({ ...f, listing_type: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {form.condition_type !== "new_listing" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Umbral ({CONDITION_UNITS[form.condition_type]})
                </label>
                <input
                  type="number"
                  value={form.threshold_value}
                  onChange={(e) => setForm((f) => ({ ...f, threshold_value: e.target.value }))}
                  placeholder={form.condition_type === "price_below" ? "ej. 20000" : "ej. 10"}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 text-white rounded-full text-sm font-bold shadow hover:bg-slate-900 transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar alerta"}
          </button>
        </div>
      )}

      {/* Alerts list */}
      {loadingAlerts ? (
        <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
          <Icon name="progress_activity" className="animate-spin" />
          <span className="text-sm">Cargando alertas…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <Icon name="notifications_off" className="text-5xl" />
          <p className="text-sm font-medium">Aún no tienes alertas configuradas</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-slate-700 dark:text-blue-400 text-sm font-semibold hover:underline"
          >
            Crear tu primera alerta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                alert.is_active
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60"
              }`}
            >
              <div
                className={`p-2.5 rounded-full flex-shrink-0 ${
                  alert.is_active
                    ? "bg-slate-100 dark:bg-blue-900/40 text-slate-700 dark:text-blue-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                <Icon
                  name={
                    alert.condition_type === "new_listing"
                      ? "home_work"
                      : alert.condition_type === "inventory_change"
                        ? "inventory_2"
                        : "trending_down"
                  }
                  className="text-xl"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {getZoneName(alert.zone_id)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatCondition(alert)}
                  {alert.property_type && ` · ${alert.property_type}`}
                  {alert.listing_type && ` · ${alert.listing_type}`}
                </p>
                {alert.last_triggered_at && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Activada:{" "}
                    {new Date(alert.last_triggered_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(alert)}
                  title={alert.is_active ? "Desactivar" : "Activar"}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    alert.is_active ? "bg-slate-700" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      alert.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleDelete(alert.id)}
                  title="Eliminar alerta"
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Icon name="delete" className="text-base" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
