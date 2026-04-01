"use client"

import { motion } from "motion/react"
import { Icon } from "@/components/icon"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-red-200/40 dark:bg-red-900/20 blur-xl scale-150" />
        <div className="relative w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
          <Icon name="error_outline" className="text-4xl text-red-500" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
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
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={reset}
        className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg"
      >
        Intentar de nuevo
      </motion.button>
    </motion.div>
  )
}
