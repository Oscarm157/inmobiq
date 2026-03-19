import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Inmobiq — Inteligencia Inmobiliaria de Tijuana",
  description:
    "Dashboard de inteligencia de mercado inmobiliario. Precios por m², tendencias, y análisis por zona para desarrolladores, inversionistas y brokers en Tijuana.",
  keywords: ["inmobiliario", "tijuana", "dashboard", "precios", "bienes raices", "mexico"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] mt-16 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Inmobiq — Inteligencia inmobiliaria para profesionales
            </p>
            <a
              href="https://narrativa360.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Potenciado por Narrativa360
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
