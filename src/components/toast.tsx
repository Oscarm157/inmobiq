"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { Icon } from "@/components/icon"

interface Toast {
  id: number
  message: string
  type: "success" | "error" | "info"
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"]) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[90] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ICONS: Record<Toast["type"], string> = {
  success: "check_circle",
  error: "error",
  info: "info",
}

const COLORS: Record<Toast["type"], string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-blue-600",
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 200)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-200 ${COLORS[toast.type]} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <Icon name={ICONS[toast.type]} className="text-base flex-shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 200) }} className="opacity-70 hover:opacity-100">
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  )
}
