export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page renders full-screen, bypassing the main sidebar shell
  return <>{children}</>
}
