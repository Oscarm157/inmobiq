import Link from "next/link"
import { Icon } from "@/components/icon"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <Icon name="explore_off" className="text-3xl text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Página no encontrada
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Ir al dashboard
      </Link>
    </div>
  )
}
