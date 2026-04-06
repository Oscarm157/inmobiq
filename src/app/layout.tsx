import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SidebarProvider } from "@/components/sidebar-provider"
import { SidebarShell } from "@/components/sidebar-shell"
import { AuthProvider } from "@/contexts/auth-context"
import { CurrencyProvider } from "@/contexts/currency-context"
import { ThemeProvider } from "@/components/theme-provider"
import { GuidedTourWrapper } from "@/components/guided-tour-wrapper"
import { ToastProvider } from "@/components/toast"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import { AuthBanner } from "@/components/auth-banner"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
})

const themeScript = `(function(){try{var s=localStorage.getItem('theme');if(s==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`

const fontLoadScript = `(function(){function m(){document.documentElement.classList.add('fonts-loaded')}if(!document.fonts){m();return}document.fonts.ready.then(m);setTimeout(m,3000)})()`

export const metadata: Metadata = {
  title: {
    default: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
    template: "%s | Inmobiq",
  },
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
  metadataBase: new URL("https://inmobiq.com"),
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Inmobiq",
    title: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
    description:
      "Precios por m², tendencias, análisis de riesgo y comparador de zonas para el mercado inmobiliario de Tijuana.",
    url: "https://inmobiq.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
    description:
      "Precios por m², tendencias, análisis de riesgo y comparador de zonas para el mercado inmobiliario de Tijuana.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
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
        <script dangerouslySetInnerHTML={{ __html: fontLoadScript }} />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bitcount+Single&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakarta.variable} font-sans bg-background text-foreground min-h-screen antialiased`}
      >
        <ThemeProvider>
          <CurrencyProvider>
            <AuthProvider>
              <SidebarProvider>
                <ToastProvider>
                  <SidebarShell>{children}</SidebarShell>
                  <AuthBanner />
                  <GuidedTourWrapper />
                  <AnalyticsTracker />
                </ToastProvider>
              </SidebarProvider>
            </AuthProvider>
          </CurrencyProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
