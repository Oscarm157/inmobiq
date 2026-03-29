"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"
import { PERFIL_CONFIGS, PERFIL_KEYS, type PerfilType } from "@/lib/profiles"
import { setPreferredPerfil, setPreferredOperacion, setPreferredCategoria, COOKIE_PERFIL } from "@/lib/preference-cookies"

interface OnboardingModalProps {
  /** If true, the modal should not appear (user already has a profile) */
  hasPerfil: boolean
}

export function OnboardingModal({ hasPerfil }: OnboardingModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PerfilType | null>(null)

  useEffect(() => {
    // Show modal only if no perfil cookie exists
    if (hasPerfil) return
    // Small delay so the page renders first
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [hasPerfil])

  const handleSelect = useCallback((perfil: PerfilType) => {
    setSelected(perfil)
    const config = PERFIL_CONFIGS[perfil]

    // Set all preference cookies
    setPreferredPerfil(perfil)
    setPreferredOperacion(config.defaultOperacion)
    setPreferredCategoria(config.defaultCategoria)

    // Persist to DB if authenticated
    fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil }),
    }).catch(() => {}) // silent fail for unauthenticated users

    // Close and refresh after brief animation
    setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 300)
  }, [router])

  const handleSkip = useCallback(() => {
    // Default to broker (everything open)
    setPreferredPerfil("broker")
    fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil: "broker" }),
    }).catch(() => {})
    setOpen(false)
    router.refresh()
  }, [router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-2xl font-black tracking-tight text-center mb-2">
          Que buscas en Inmobiq?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Personaliza tu experiencia. Puedes cambiar esto cuando quieras.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {PERFIL_KEYS.map((key) => {
            const config = PERFIL_CONFIGS[key]
            const isSelected = selected === key
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 text-center ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.97]"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  <Icon name={config.icon} className="text-2xl" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {config.label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {config.description}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSkip}
          className="w-full mt-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Explorar libremente
        </button>
      </div>
    </div>
  )
}
