import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  robots: { index: false, follow: false },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page renders full-screen, bypassing the main sidebar shell
  return <>{children}</>
}
