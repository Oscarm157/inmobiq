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
import { AuthModal } from "@/components/auth-modal"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
})

const themeScript = `(function(){try{var s=localStorage.getItem('theme');if(s==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`

const fontLoadScript = `(function(){function m(){document.documentElement.classList.add('fonts-loaded')}if(!document.fonts){m();return}document.fonts.ready.then(m);setTimeout(m,3000);var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Bitcount+Single&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap';document.head.appendChild(l)})()`

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
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Material Symbols: subset with only used icons (~57KB vs 1,084KB) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,400,0..1&icon_names=account_circle,add,add_photo_alternate,admin_panel_settings,analytics,arrow_back,arrow_forward,arrow_forward_ios,attach_money,auto_awesome,balance,bathtub,bed,bug_report,calendar_today,chair,check,check_circle,check_circle_outline,chevron_right,close,compare,compare_arrows,currency_exchange,delete,donut_small,edit,edit_note,email,error,error_outline,expand_more,explore,explore_off,filter_alt,filter_list,flag,grid_view,group,groups,help_outline,history,home,home_work,hourglass_empty,hourglass_top,info,ios_share,lightbulb,location_city,location_off,location_on,lock_open,login,logout,map,monitoring,more_vert,notifications_off,open_in_new,payments,percent,person,person_add,phone,progress_activity,psychology,query_stats,receipt_long,rocket_launch,save,savings,school,search,search_off,sell,share,speed,star,straighten,travel_explore,trending_down,trending_flat,trending_up,tune,update,warning,workspace_premium&display=swap"
          rel="stylesheet"
        />
        {/* Bitcount + Playfair: loaded async via script (not render-blocking) — only used in sidebar */}
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
                  <AuthModal />
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
