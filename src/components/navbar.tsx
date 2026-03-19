import Link from "next/link";
import { BarChart3, Search } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--accent)]" />
            <span className="text-xl font-bold tracking-tight">
              Inmobiq
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Buscar zona o colonia..."
                className="h-9 w-64 rounded-lg border border-[var(--border)] bg-[var(--secondary)] pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              />
            </div>
            <Link
              href="https://narrativa360.vercel.app"
              target="_blank"
              className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Narrativa360
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
