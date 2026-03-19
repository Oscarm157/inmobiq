import type { Metadata } from "next"
import { SidebarProvider } from "@/components/sidebar-provider"
import { SidebarShell } from "@/components/sidebar-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
  description:
    "Dashboard de inteligencia de mercado inmobiliario. Precios por m², tendencias, y análisis por zona para desarrolladores, inversionistas y brokers en Tijuana.",
  keywords: [
    "inmobiliario",
    "tijuana",
    "dashboard",
    "precios",
    "bienes raices",
    "mexico",
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="bg-slate-50 text-slate-900 min-h-screen antialiased"
      >
        <SidebarProvider>
          <SidebarShell>{children}</SidebarShell>
        </SidebarProvider>
      </body>
    </html>
  )
}
