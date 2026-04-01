import Link from "next/link"
import { Icon } from "@/components/icon"
import { FadeInUp } from "@/components/motion-wrappers"

export default function NotFound() {
  return (
    <FadeInUp>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-slate-200/40 dark:bg-slate-700/20 blur-xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon name="explore_off" className="text-4xl text-slate-400" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Ir al dashboard
        </Link>
      </div>
    </FadeInUp>
  )
}
