import Link from "next/link"
import Image from "next/image"

export function MarketingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[var(--m-canvas)] border-t border-[var(--m-gray-4)]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-2">
            <Image
              src="/logo-inmobiq.png"
              alt="Inmobiq"
              width={120}
              height={28}
              className="h-7 w-auto mb-4"
            />
            <p className="m-body max-w-sm" style={{ fontSize: "0.9375rem" }}>
              Inteligencia inmobiliaria por zona en Tijuana. Para brokers, desarrolladores e inversionistas.
            </p>
          </div>

          <div>
            <p className="m-eyebrow mb-4">Producto</p>
            <ul className="flex flex-col gap-2.5 text-[14px] text-[var(--m-ink-soft)]">
              <li><a href="#producto" className="hover:text-[var(--m-accent-ink)] transition-colors">Funciones</a></li>
              <li><a href="#datos" className="hover:text-[var(--m-accent-ink)] transition-colors">Fuentes de datos</a></li>
              <li><a href="#precios" className="hover:text-[var(--m-accent-ink)] transition-colors">Precios</a></li>
              <li><Link href="/login" className="hover:text-[var(--m-accent-ink)] transition-colors">Iniciar sesión</Link></li>
            </ul>
          </div>

          <div>
            <p className="m-eyebrow mb-4">Empresa</p>
            <ul className="flex flex-col gap-2.5 text-[14px] text-[var(--m-ink-soft)]">
              <li><Link href="/politica-privacidad" className="hover:text-[var(--m-accent-ink)] transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-[var(--m-accent-ink)] transition-colors">Términos</Link></li>
              <li><a href="mailto:oscar.amayoral@gmail.com" className="hover:text-[var(--m-accent-ink)] transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--m-gray-4)] flex flex-col md:flex-row justify-between gap-3 text-[12px] text-[var(--m-gray-2)]">
          <p>&copy; {year} Inmobiq. Tijuana, B.C., México.</p>
          <p>Datos del mercado de Tijuana, B.C. Actualización semanal.</p>
        </div>
      </div>
    </footer>
  )
}
