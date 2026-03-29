# Deuda Técnica y Pendientes Go-to-Live

Última actualización: 2026-03-29

---

## Estado: 95% listo para producción

Todo el código está completo. Lo pendiente es configuración de servicios externos.

---

## CONFIGURACIÓN MANUAL (Oscar)

### 1. Dominio custom en Vercel
**Prioridad**: CRÍTICO
**Tiempo**: 15 min + esperar propagación DNS

**Si ya tienes dominio:**
1. Vercel Dashboard → proyecto `inmobiq` → Settings → Domains
2. Escribir `inmobiq.com` → clic "Add"
3. Vercel da registros DNS:
   - Tipo `A` → `76.76.21.21`
   - Tipo `CNAME` → `cname.vercel-dns.com` (para `www`)
4. Ir al registrador de dominio (GoDaddy, Namecheap, Cloudflare)
5. DNS → Agregar los registros que dio Vercel
6. Esperar 10-30 min a que propague
7. Vercel genera SSL automáticamente

**Si no tienes dominio:**
- Comprar en Namecheap (~$10 USD/año) o directo en Vercel (Settings → Domains → "Buy")
- Si se compra en Vercel, se configura solo

---

### 2. Supabase Auth redirect URLs
**Prioridad**: CRÍTICO — sin esto Google login y reset password fallan en producción
**Tiempo**: 5 min

1. Ir a app.supabase.com
2. Seleccionar proyecto (`fpeangrcwpqsqnunesym`)
3. Sidebar → Authentication → URL Configuration
4. **Site URL**: cambiar de `http://localhost:3000` a `https://inmobiq.com`
5. **Redirect URLs**: clic "Add URL" y agregar:
   - `https://inmobiq.com/auth/callback`
   - `https://inmobiq.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (para desarrollo local)
6. Clic "Save"

---

### 3. Vercel Analytics
**Prioridad**: Recomendado
**Tiempo**: 1 min

1. vercel.com/dashboard
2. Clic en proyecto `inmobiq`
3. Tab Analytics (arriba)
4. Clic "Enable"

---

### 4. Emails de contacto
**Prioridad**: Requerido por LFPDPPP (ley de privacidad mexicana)
**Tiempo**: 10 min

Se necesitan: `contacto@inmobiq.com` y `privacidad@inmobiq.com`

**Opción A — Google Workspace ($6 USD/mes):**
1. workspace.google.com → registrar con dominio `inmobiq.com`
2. Crear buzones
3. Agregar registros MX en DNS

**Opción B — Gratis con Zoho Mail:**
1. zoho.com/mail → plan gratis
2. Agregar dominio, verificar con TXT record
3. Crear buzones

**Opción C — Solo forwarding (más simple y gratis):**
1. En el registrador de dominio buscar "Email Forwarding"
2. `contacto@inmobiq.com` → redirige a `oscar.amayoral@gmail.com`
3. `privacidad@inmobiq.com` → redirige a `oscar.amayoral@gmail.com`
4. Gratis en Namecheap y Cloudflare

---

### 5. Email templates de Supabase
**Prioridad**: Recomendado — sin esto los emails salen con branding genérico de Supabase
**Tiempo**: 10 min

1. Supabase Dashboard → Authentication → Email Templates
2. Editar los 4 templates:

**Confirm signup:**
```
Asunto: Confirma tu cuenta — Inmobiq

<h2>Bienvenido a Inmobiq</h2>
<p>Haz clic para confirmar tu cuenta:</p>
<a href="{{ .ConfirmationURL }}">Confirmar cuenta</a>
<p>Si no creaste esta cuenta, ignora este correo.</p>
<p>— Inmobiq · Inteligencia Inmobiliaria</p>
```

**Reset password:**
```
Asunto: Restablecer contraseña — Inmobiq

<h2>Restablecer contraseña</h2>
<p>Haz clic para crear una nueva contraseña:</p>
<a href="{{ .ConfirmationURL }}">Restablecer contraseña</a>
<p>Si no solicitaste esto, ignora este correo.</p>
<p>— Inmobiq · Inteligencia Inmobiliaria</p>
```

**Magic link:**
```
Asunto: Tu link de acceso — Inmobiq

<h2>Accede a Inmobiq</h2>
<a href="{{ .ConfirmationURL }}">Iniciar sesión</a>
<p>— Inmobiq · Inteligencia Inmobiliaria</p>
```

**Change email:**
```
Asunto: Confirma tu nuevo email — Inmobiq

<h2>Confirmar cambio de email</h2>
<a href="{{ .ConfirmationURL }}">Confirmar nuevo email</a>
<p>— Inmobiq · Inteligencia Inmobiliaria</p>
```

3. Clic "Save" en cada uno

---

## DEUDA TÉCNICA (código)

### Pendiente pero no bloquea lanzamiento

| Item | Impacto | Esfuerzo |
|------|---------|----------|
| Sentry error tracking | Sin esto no vemos errores en producción | 30 min, necesita cuenta en sentry.io |
| UptimeRobot monitoreo | Saber si el sitio se cae | 10 min, gratis |
| Reemplazar assets placeholder (favicon, og-image) | Se ve genérico al compartir links | Depende de diseño |
| E2E tests (Playwright) | No hay tests de integración | 4-8 hrs |
| ISR/cache en zona pages | Las zonas son dinámicas por cookies, podrían cachearse | 2 hrs, refactor de cookies a client-side |

### Zona classification (en progreso)
- Oscar dibujará polígonos GeoJSON de ~28 zonas en geojson.io
- Con esos polígonos se reemplazarán los centroides INEGI
- El clasificador híbrido (script + IA) ya está listo, falta data de polígonos

### Datos
- Solo hay data de inmuebles24 — faltan lamudi, vivanuncios, mercadolibre (scrapers listos, no ejecutados)
- Datos de renta importados (400 listings) pero no hay scraping automático de renta aún
- Snapshots históricos: solo 1-2 semanas reales, el chart de tendencias usa mock

---

## ORDEN RECOMENDADO PARA LANZAR

| # | Qué | Tiempo | Cuándo |
|---|-----|--------|--------|
| 1 | Dominio en Vercel + DNS | 15 min + propagación | Hacer primero |
| 2 | Supabase Auth URLs | 5 min | Inmediatamente después del dominio |
| 3 | Test: login con Google en prod | 5 min | Verificar que funcione |
| 4 | Test: reset password en prod | 5 min | Verificar que funcione |
| 5 | Email forwarding | 10 min | Antes de lanzar |
| 6 | Email templates Supabase | 10 min | Antes de lanzar |
| 7 | Vercel Analytics | 1 min | Cuando quieras |
| 8 | Lanzar | 0 min | Ya está en producción |
