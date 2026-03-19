import { Icon } from "@/components/icon"

export function TopHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-white/80 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(24,28,31,0.06)] h-16 flex justify-between items-center px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            type="text"
            placeholder="Buscar activos en Tijuana..."
            className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Icon name="notifications" />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Icon name="settings" />
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-200 flex items-center justify-center">
          <Icon name="person" className="text-blue-700 text-sm" />
        </div>
      </div>
    </header>
  )
}
