# Pendientes Oscar — Go-to-Live

Tareas que requieren acción manual, acceso a dashboards, o decisiones de diseño.
Cada tarea incluye una explicación de por qué es necesaria.

---

## Semana 1 — Base de Datos

| # | Tarea | Dónde | Por qué |
|---|-------|-------|---------|
| 1 | Ejecutar `PENDING_run_in_sql_editor.sql` | Supabase → SQL Editor | Este archivo crea tablas e índices que el código ya usa. Sin ejecutarlo, algunas funciones pueden fallar o ser lentas en producción. |
| 2 | Ejecutar `20260325_rate_limits.sql` | Supabase → SQL Editor | Crea la tabla que lleva la cuenta de cuántas veces cada usuario usa los endpoints. Sin esto, el rate limiting (que ya está en código) no funciona — cualquiera puede abusar de los exports. |

---

## Semana 2 — Imagen, Dominio y Monitoreo

| # | Tarea | Dónde | Por qué |
|---|-------|-------|---------|
| 3 | ~~Crear `og-image.png`~~ | ~~`/public/og-image.png`~~ | **HECHO** — Placeholder generado (1200x630). Reemplazar con diseño final cuando esté listo. |
| 4 | ~~Crear `favicon`~~ | ~~`/public/favicon.svg`~~ | **HECHO** — SVG placeholder con "IQ". Reemplazar con diseño final. |
| 5 | ~~Crear `apple-touch-icon.png`~~ | ~~`/public/apple-touch-icon.png`~~ | **HECHO** — PNG placeholder (180x180). Reemplazar con diseño final. |
| 6 | Configurar dominio custom | Vercel Dashboard → Settings → Domains | La plataforma vive en `inmobiq.vercel.app` — funciona pero se ve poco profesional y no posiciona bien en Google. Un dominio propio (`inmobiq.com` o `inmobiq.mx`) es necesario para el lanzamiento. |
| 7 | Actualizar `BASE_URL` en código | `src/app/sitemap.ts` y `public/robots.txt` | Actualmente dicen `https://inmobiq.com`. Si el dominio final es diferente (ej: `inmobiq.mx`), hay que cambiarlo para que Google indexe correctamente. |
| 8 | Configurar UptimeRobot | uptimerobot.com (gratis) | UptimeRobot revisa cada 5 minutos si tu sitio responde. Si se cae, te manda email o SMS al instante. Sin esto, podrías estar caído horas sin enterarte — tus usuarios se irían y no sabrías por qué. Monitorear: `https://tudominio.com/api/health` |
| 9 | Crear emails de contacto | Proveedor de dominio o Google Workspace | Las páginas legales dicen `privacidad@inmobiq.com` y `contacto@inmobiq.com`. Si alguien escribe a esas direcciones y rebotan, pierdes credibilidad. Además, la LFPDPPP requiere un canal de contacto funcional para ejercer derechos ARCO. |
| 10 | Habilitar Vercel Analytics | Vercel Dashboard → Analytics tab → Enable | La librería ya está instalada en el código y lista para funcionar. Pero Vercel requiere que la actives desde su panel. Sin esto, se recopilan 0 datos de visitas aunque haya miles de usuarios. |

---

## Semana 3 — Auth y Monitoreo

| # | Tarea | Dónde | Por qué |
|---|-------|-------|---------|
| 11 | Personalizar email templates de Supabase | Supabase Dashboard → Auth → Email Templates | Cuando un usuario pide recuperar su contraseña, recibe un correo. Por default ese correo viene con el diseño genérico de Supabase — sin logo, sin colores, parece spam. Personalizarlo con branding Inmobiq hace que el usuario confíe en el correo y no lo ignore. |
| 12 | Configurar redirect URLs en Supabase Auth | Supabase Dashboard → Auth → URL Configuration | Para que el login con Google y el reset de contraseña funcionen cuando la plataforma esté en tu dominio real, Supabase necesita tener ese dominio en su lista de URLs permitidas. Sin esto, el usuario hace click en el link del correo y llega a una página de error. Agregar: `https://tudominio.com/auth/callback` |
| 13 | Probar flujo completo de password reset | Desde `/login` | El código está listo, pero necesitas probarlo de punta a punta: click en "¿Olvidaste tu contraseña?" → ingresar email → verificar que llega el correo → click en el link → confirmar que funciona. Es mejor encontrar un bug ahora que el día del lanzamiento frente a un usuario real. |
| 14 | Instalar Sentry (error tracking) | Terminal: `npx @sentry/wizard@latest -i nextjs` | Si algo falla en producción (un error de JavaScript, una API que no responde), hoy no nos enteramos a menos que un usuario nos escriba. Sentry captura cada error automáticamente, dice qué lo causó, y manda alertas. Sin esto, estamos ciegos ante problemas que afectan a los usuarios. Requiere crear cuenta en sentry.io. |

---

## Semana 4 — QA y Lanzamiento

| # | Tarea | Dónde | Por qué |
|---|-------|-------|---------|
| 15 | Test completo en mobile | iPhone Safari + Android Chrome | Muchos bugs solo aparecen en celular (mapas que no cargan, tablas que se salen de la pantalla, botones que no responden al toque). Si la mayoría de los usuarios van a entrar desde el celular, tiene que funcionar perfecto ahí. |
| 16 | Test de auth flow | Desde `/login` | Probar: registro nuevo → verificar email → login con email → login con Google → cerrar sesión → acceder a ruta protegida sin sesión. Si alguno de estos pasos falla el día del lanzamiento, nadie puede usar la plataforma. |
| 17 | Test de exports | Desde `/zona/zona-rio` y `/riesgo` | Probar que los PDFs y Excel se descarguen correctamente con datos reales. Verificar que los PDFs no estén vacíos, que los números hagan sentido, y que los archivos se puedan abrir en Excel/Google Sheets sin problemas. |
| 18 | Verificar scraping en producción | Admin panel (`/admin/scraper`) | Confirmar que el sistema de recopilación de datos funciona desde el servidor de Vercel y que los datos se actualizan. Si el scraping no funciona en producción, la plataforma mostrará datos viejos o incompletos. |
| 19 | UAT final (User Acceptance Test) | Navegar toda la plataforma | Recorrer cada página como si fueras un usuario nuevo: ¿se entiende todo? ¿los números tienen sentido? ¿algo se ve roto? Este es el último filtro antes de invitar a personas reales. |

---

## Resumen rápido

- **Total de pendientes**: 16 (3 completados de 19)
- **Semana 1**: 2 tareas (SQL)
- **Semana 2**: 5 tareas pendientes (~~3 assets completados~~, dominio, monitoreo)
- **Semana 3**: 4 tareas (auth config, Sentry)
- **Semana 4**: 5 tareas (testing manual)

**Prioridad #1** (bloquean funcionalidad):
→ #1, #2 (migraciones SQL), #12 (redirect URLs)

**Prioridad #2** (afectan imagen profesional):
→ ~~#3 (og-image)~~, ~~#4 (favicon)~~, #9 (emails), #11 (email templates)

**Prioridad #3** (mejoran operación):
→ #8 (UptimeRobot), #10 (Analytics), #14 (Sentry)
