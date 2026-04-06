"use client"

import { useState, useRef, useCallback } from "react"
import { Icon } from "@/components/icon"

interface Props {
  onExtracted: (valuationId: string, data: Record<string, unknown>) => void
  onAuthRequired?: () => void
  disabled?: boolean
}

const MAX_FILES = 5
const MAX_SIZE = 5 * 1024 * 1024

export function ScreenshotUploader({ onExtracted, onAuthRequired, disabled }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    const valid: File[] = []
    for (const f of arr) {
      if (!f.type.match(/^image\/(jpeg|png|webp)$/)) {
        setError(`Tipo no soportado: ${f.name}. Usa JPEG, PNG o WebP.`)
        return
      }
      if (f.size > MAX_SIZE) {
        setError(`Archivo muy grande: ${f.name} (máx 5MB)`)
        return
      }
      valid.push(f)
    }

    setFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, MAX_FILES)
      // Generate previews
      const newPreviews = combined.map((f) => URL.createObjectURL(f))
      setPreviews((old) => {
        old.forEach((url) => URL.revokeObjectURL(url))
        return newPreviews
      })
      return combined
    })
    setError(null)
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      setPreviews((old) => {
        URL.revokeObjectURL(old[index])
        return old.filter((_, i) => i !== index)
      })
      return next
    })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleSubmit = async () => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("screenshots", f))

      const res = await fetch("/api/brujula/extract", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401 && onAuthRequired) {
          onAuthRequired()
          return
        }
        setError(data.error || "Error procesando screenshots")
        return
      }

      onExtracted(data.valuationId, data.extracted)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          files.length >= MAX_FILES
            ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            : "border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <Icon name="add_photo_alternate" className="text-4xl text-blue-400 dark:text-blue-500 mb-2" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          {files.length >= MAX_FILES
            ? `Máximo ${MAX_FILES} screenshots`
            : "Arrastra screenshots aquí o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          JPEG, PNG o WebP. Máx 5MB por archivo.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 max-w-xs">
          La IA extraerá automáticamente: precio, superficie, recámaras, tipo de propiedad y ubicación del anuncio.
        </p>
      </div>

      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {previews.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="close" className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={files.length === 0 || loading || disabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Icon name="hourglass_empty" className="text-base animate-spin" />
            Analizando con IA...
          </>
        ) : (
          <>
            <Icon name="auto_awesome" className="text-base" />
            Analizar ({files.length} {files.length === 1 ? "imagen" : "imágenes"})
          </>
        )}
      </button>
    </div>
  )
}
