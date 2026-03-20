import type { Metadata } from "next"
import { SidebarProvider } from "@/components/sidebar-provider"
import { SidebarShell } from "@/components/sidebar-shell"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d))document.documentElement.classList.add('dark')}catch(e){}})()`

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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
        className="bg-background text-foreground min-h-screen antialiased"
      >
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <SidebarShell>{children}</SidebarShell>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
