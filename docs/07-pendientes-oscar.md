# Pendientes Oscar — Go-to-Live

Tareas que requieren acción manual, acceso a dashboards, o decisiones de diseño.

---

## Semana 1

| # | Tarea | Dónde | Estado |
|---|-------|-------|--------|
| 1 | Ejecutar `PENDING_run_in_sql_editor.sql` | Supabase SQL Editor | Pendiente |
| 2 | Ejecutar `20260325_rate_limits.sql` | Supabase SQL Editor | Pendiente |

## Semana 2

| # | Tarea | Dónde | Notas |
|---|-------|-------|-------|
| 3 | Crear `og-image.png` (1200x630px) | Poner en `/public/og-image.png` | Imagen para compartir links en WhatsApp/Twitter/LinkedIn. Screenshot del dashboard con logo |
| 4 | Crear `favicon.ico` | Poner en `/public/favicon.ico` | Iconito de pestaña. Usa realfavicongenerator.net |
| 5 | Crear `apple-touch-icon.png` (180x180px) | Poner en `/public/apple-touch-icon.png` | Para homescreen de iPhone |
| 6 | Configurar dominio custom | Vercel Dashboard → Domains | Registrar `inmobiq.com` o `.mx`, apuntar DNS a Vercel |
| 7 | Actualizar `BASE_URL` en sitemap y robots.txt | Código — cuando tengas dominio | Actualmente dice `https://inmobiq.com` |
| 8 | Configurar UptimeRobot | uptimerobot.com | Monitorear `https://tudominio.com/api/health` cada 5 min |
| 9 | Crear emails | Proveedor de dominio | `privacidad@inmobiq.com` y `contacto@inmobiq.com` (referenciados en páginas legales) |
| 10 | Habilitar Vercel Analytics | Vercel Dashboard → Analytics | Librería ya instalada, solo activar en dashboard |

## Semana 3

| # | Tarea | Dónde | Notas |
|---|-------|-------|-------|
| 11 | Configurar Supabase email templates | Supabase Dashboard → Auth → Email Templates | El password reset ya funciona en código pero Supabase envía un email genérico. Personalizar template con branding Inmobiq |
| 12 | Configurar redirect URL en Supabase Auth | Supabase Dashboard → Auth → URL Configuration | Agregar tu dominio de producción a los redirect URLs permitidos (para que el reset de password y OAuth funcionen) |
| 13 | Probar flujo completo de password reset | Desde `/login` | Click "¿Olvidaste tu contraseña?" → ingresar email → verificar que llega el correo → click link → verificar que redirige correctamente |
| 14 | Instalar Sentry | Vercel Integration o manual | `npx @sentry/wizard@latest -i nextjs` — requiere crear proyecto en sentry.io y obtener DSN |

## Semana 4

*(se irá llenando conforme avancemos)*
