"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"
import Link from "next/link"

interface RegistrationGateProps {
  children: React.ReactNode
  isGated: boolean
}

export function RegistrationGate({ children, isGated }: RegistrationGateProps) {
  const { user, loading } = useAuth()

  const showGate = isGated && !user && !loading

  // Prevent scroll when gate is active
  useEffect(() => {
    if (showGate) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [showGate])

  if (!showGate) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-[6px] pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Registration overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="lock_open" className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-xl font-black tracking-tight mb-2">
            Desbloquea todas las zonas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 max-w-xs mx-auto">
            Regístrate gratis para acceder al análisis completo de las {30} zonas de Tijuana.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-slate-800 dark:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-700 dark:hover:bg-blue-500 transition-colors"
            >
              <Icon name="person_add" className="text-base" />
              Crear cuenta gratis
            </Link>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Ya tengo cuenta — Iniciar sesión
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">
              La zona <strong>Zona Río</strong> y el panorama general de Tijuana están disponibles sin registro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
