"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
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
      <main
        className={`min-h-screen pb-20 transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </>
  )
}
