import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones — Inmobiq",
  description: "Términos y condiciones de uso de la plataforma Inmobiq.",
}

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">
        Términos y Condiciones de Uso
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última actualización: 25 de marzo de 2026
      </p>

      <div className="prose-sm mt-8 space-y-6 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar la plataforma Inmobiq (en adelante &ldquo;la
            Plataforma&rdquo; o &ldquo;el Servicio&rdquo;), usted acepta quedar
            vinculado por los presentes términos y condiciones. Si no está de
            acuerdo con alguno de estos términos, le pedimos que no utilice la
            Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Descripción del servicio
          </h2>
          <p>
            Inmobiq es una plataforma de inteligencia de mercado inmobiliario
            enfocada en la ciudad de Tijuana, Baja California, México. El
            Servicio ofrece:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Análisis estadísticos del mercado inmobiliario por zona (precios
              por m², tendencias, composición de oferta).
            </li>
            <li>
              Indicadores de riesgo, asequibilidad y potencial de inversión.
            </li>
            <li>
              Datos demográficos cruzados con información de mercado.
            </li>
            <li>
              Herramientas de comparación, visualización y exportación de datos.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. Naturaleza de la información
          </h2>
          <p>
            La información presentada en la Plataforma tiene carácter
            <strong> informativo y de referencia</strong>. Los datos provienen de
            fuentes públicas disponibles en internet (portales inmobiliarios) y
            del Censo de Población y Vivienda 2020 del INEGI.
          </p>
          <p>
            <strong>Inmobiq no es un valuador inmobiliario certificado</strong> y
            la información no constituye una valuación formal, una asesoría de
            inversión ni una recomendación de compra o venta. Las decisiones
            basadas en la información de la Plataforma son responsabilidad
            exclusiva del usuario.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Cuenta de usuario
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Para acceder a funcionalidades como exportaciones, alertas y
              personalización, es necesario crear una cuenta.
            </li>
            <li>
              Usted es responsable de mantener la confidencialidad de sus
              credenciales de acceso.
            </li>
            <li>
              Nos reservamos el derecho de suspender o cancelar cuentas que
              infrinjan estos términos o hagan uso indebido de la Plataforma.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Uso permitido
          </h2>
          <p>El usuario se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Utilizar la Plataforma únicamente para fines lícitos y conforme a
              estos términos.
            </li>
            <li>
              No intentar acceder a áreas restringidas del sistema, bases de
              datos o funcionalidades administrativas sin autorización.
            </li>
            <li>
              No realizar scraping, descarga masiva o automatizada de datos de
              la Plataforma sin autorización previa por escrito.
            </li>
            <li>
              No reproducir, distribuir o comercializar los datos, reportes o
              análisis generados por la Plataforma sin autorización.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Propiedad intelectual
          </h2>
          <p>
            El diseño, código fuente, logotipos, gráficas, indicadores,
            metodologías de análisis y demás elementos originales de la
            Plataforma son propiedad de Inmobiq y están protegidos por la
            legislación aplicable en materia de propiedad intelectual.
          </p>
          <p>
            Los datos estadísticos del INEGI son de uso público conforme a la
            Ley del Sistema Nacional de Información Estadística y Geográfica.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Limitación de responsabilidad
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Precisión de datos:</strong> Aunque nos esforzamos por
              mantener la información actualizada y precisa, no garantizamos la
              exactitud, completitud o vigencia de los datos presentados. Los
              precios de mercado cambian constantemente y las fuentes pueden
              contener errores.
            </li>
            <li>
              <strong>Disponibilidad:</strong> No garantizamos que la Plataforma
              estará disponible de forma ininterrumpida o libre de errores.
              Podremos realizar mantenimientos programados o de emergencia.
            </li>
            <li>
              <strong>Daños:</strong> En ningún caso Inmobiq será responsable
              por daños directos, indirectos, incidentales o consecuentes
              derivados del uso o la imposibilidad de uso de la Plataforma.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. Privacidad
          </h2>
          <p>
            El tratamiento de sus datos personales se rige por nuestro{" "}
            <a
              href="/politica-privacidad"
              className="text-blue-500 hover:underline"
            >
              Aviso de Privacidad
            </a>
            , el cual forma parte integral de estos términos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            9. Modificaciones
          </h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier
            momento. Los cambios serán publicados en esta página con la fecha de
            actualización. El uso continuado de la Plataforma después de dichos
            cambios constituye su aceptación de los mismos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            10. Legislación aplicable
          </h2>
          <p>
            Los presentes términos se rigen por las leyes de los Estados Unidos
            Mexicanos. Para cualquier controversia derivada del uso de la
            Plataforma, las partes se someten a la jurisdicción de los
            tribunales competentes en la ciudad de Tijuana, Baja California.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            11. Contacto
          </h2>
          <p>
            Para cualquier duda o aclaración respecto a estos términos, puede
            contactarnos en <strong>contacto@inmobiq.com</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
