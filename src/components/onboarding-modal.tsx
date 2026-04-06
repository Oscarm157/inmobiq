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
  const [step, setStep] = useState<1 | 2>(1)
  const [selected, setSelected] = useState<PerfilType | null>(null)
  const [phone, setPhone] = useState("")
  const [referralSource, setReferralSource] = useState("")

  useEffect(() => {
    // Show modal only if no perfil cookie exists
    if (hasPerfil) return
    // Small delay so the page renders first
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [hasPerfil])

  const handleSelect = useCallback((perfil: PerfilType) => {
    setSelected(perfil)
    setStep(2)
  }, [])

  const handleFinish = useCallback((skipExtras?: boolean) => {
    const perfil = selected ?? "broker"
    const config = PERFIL_CONFIGS[perfil]

    // Set all preference cookies
    setPreferredPerfil(perfil)
    setPreferredOperacion(config.defaultOperacion)
    setPreferredCategoria(config.defaultCategoria)

    // Persist to DB if authenticated
    const body: Record<string, string> = { perfil }
    if (!skipExtras && phone) body.phone = phone
    if (!skipExtras && referralSource) body.referral_source = referralSource

    fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {})

    setOpen(false)
    router.refresh()
  }, [selected, phone, referralSource, router])

  const handleSkip = useCallback(() => {
    setSelected(null)
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
        {step === 1 ? (
          <>
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
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black tracking-tight text-center mb-2">
              Cuéntanos un poco más
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Esto nos ayuda a mejorar. Puedes omitirlo si prefieres.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 664 123 4567"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ¿Cómo nos encontraste?
                </label>
                <select
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-all"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="google">Google</option>
                  <option value="redes_sociales">Redes sociales</option>
                  <option value="recomendacion">Recomendación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleFinish()}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              Continuar
            </button>
            <button
              onClick={() => handleFinish(true)}
              className="w-full mt-2 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Omitir
            </button>
          </>
        )}
      </div>
    </div>
  )
}
