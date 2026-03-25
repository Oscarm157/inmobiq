"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { ModeTabs } from "@/components/mode-tabs"
import { useSidebar } from "@/components/sidebar-provider"

const FULL_SCREEN_ROUTES = ["/login"]

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const pathname = usePathname()

  if (FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <TopHeader />
      <Suspense fallback={null}>
        <ModeTabs />
      </Suspense>
      <main
        className={`min-h-screen pb-20 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="pt-[7.5rem] px-4 sm:px-8 max-w-7xl mx-auto">
          {children}
        </div>
        <footer className="px-4 sm:px-8 max-w-7xl mx-auto py-8 mt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span>&copy; {new Date().getFullYear()} Inmobiq</span>
            <a href="/politica-privacidad" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Política de Privacidad
            </a>
            <a href="/terminos" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </footer>
      </main>
      <BottomNav />
    </>
  )
}
