"use client"

import { Icon } from "@/components/icon"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-6">
        <Icon name="error_outline" className="text-3xl text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Algo salió mal
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Ocurrió un error inesperado. Si el problema persiste, contacta a soporte.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 mb-4 font-mono">
          Ref: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
