import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad — Inmobiq",
  description: "Aviso de privacidad y tratamiento de datos personales de Inmobiq.",
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">
        Aviso de Privacidad
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última actualización: 25 de marzo de 2026
      </p>

      <div className="prose-sm mt-8 space-y-6 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Responsable del tratamiento
          </h2>
          <p>
            <strong>Inmobiq</strong> (en adelante &ldquo;la Plataforma&rdquo;),
            con domicilio en Tijuana, Baja California, México, es responsable
            del tratamiento de los datos personales que usted nos proporcione,
            los cuales serán protegidos conforme a lo dispuesto por la Ley
            Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP) y demás normatividad aplicable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Datos personales que recabamos
          </h2>
          <p>Para los fines señalados en este aviso, podemos recabar las siguientes categorías de datos personales:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Datos de identificación:</strong> nombre completo, correo
              electrónico, fotografía de perfil (cuando utiliza inicio de sesión
              con Google).
            </li>
            <li>
              <strong>Datos de uso:</strong> páginas visitadas, filtros
              utilizados, búsquedas realizadas, zonas consultadas y reportes
              generados dentro de la plataforma.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP, tipo de navegador,
              sistema operativo y cookies de sesión necesarias para el
              funcionamiento del servicio.
            </li>
          </ul>
          <p>
            <strong>No recabamos datos personales sensibles</strong> (origen
            étnico, salud, datos financieros bancarios, etc.).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. Finalidades del tratamiento
          </h2>
          <p>Los datos personales que recabamos se utilizan para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Crear y administrar su cuenta de usuario.</li>
            <li>
              Proveer acceso a los servicios de la plataforma (dashboard,
              análisis de zonas, exportaciones, alertas de precio).
            </li>
            <li>Personalizar su experiencia en la plataforma.</li>
            <li>
              Enviar comunicaciones relacionadas con el servicio (actualizaciones,
              alertas configuradas por el usuario, avisos de mantenimiento).
            </li>
            <li>
              Mejorar la calidad del servicio mediante análisis agregados de uso.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Origen de los datos de mercado
          </h2>
          <p>
            Los datos inmobiliarios mostrados en la plataforma provienen de
            fuentes públicas de internet y del Censo de
            Población y Vivienda 2020 del INEGI. Estos datos son de carácter
            estadístico y no constituyen datos personales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Transferencia de datos
          </h2>
          <p>
            Para el funcionamiento de la plataforma, sus datos pueden ser
            tratados por los siguientes proveedores de servicios tecnológicos:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase Inc.</strong> — Almacenamiento de base de datos y
              autenticación.
            </li>
            <li>
              <strong>Vercel Inc.</strong> — Hospedaje y distribución de la
              aplicación web.
            </li>
            <li>
              <strong>Google LLC</strong> — Servicio de autenticación OAuth
              (cuando elige iniciar sesión con Google).
            </li>
          </ul>
          <p>
            Estos proveedores cuentan con políticas de privacidad propias y
            medidas de seguridad adecuadas para la protección de datos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Derechos ARCO
          </h2>
          <p>
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al
            tratamiento de sus datos personales (derechos ARCO). Para ejercer
            cualquiera de estos derechos, envíe un correo electrónico a{" "}
            <strong>privacidad@inmobiq.com</strong> indicando:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Su nombre completo y correo electrónico registrado.</li>
            <li>
              El derecho que desea ejercer y una descripción clara de lo que
              solicita.
            </li>
          </ul>
          <p>
            Responderemos su solicitud en un plazo máximo de 20 días hábiles
            conforme a la LFPDPPP.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Cookies
          </h2>
          <p>
            La plataforma utiliza cookies estrictamente necesarias para mantener
            su sesión activa y recordar sus preferencias (tema visual, moneda,
            filtros). No utilizamos cookies de publicidad ni de seguimiento de
            terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. Medidas de seguridad
          </h2>
          <p>
            Implementamos medidas de seguridad técnicas, administrativas y
            físicas para proteger sus datos personales contra daño, pérdida,
            alteración, destrucción o el uso, acceso o tratamiento no autorizado.
            Estas incluyen cifrado en tránsito (HTTPS/TLS), políticas de acceso
            a nivel de fila en la base de datos (RLS), y autenticación segura
            mediante tokens.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            9. Modificaciones al aviso
          </h2>
          <p>
            Nos reservamos el derecho de modificar el presente aviso de
            privacidad. Cualquier cambio será publicado en esta misma página con
            la fecha de actualización correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            10. Contacto
          </h2>
          <p>
            Para cualquier duda o aclaración respecto a este aviso de privacidad,
            puede contactarnos en{" "}
            <strong>privacidad@inmobiq.com</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
