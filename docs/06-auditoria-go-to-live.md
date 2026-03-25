# Auditoría Go-to-Live — Inmobiq

**Fecha de auditoría inicial**: 25 de marzo de 2026
**Última actualización**: 25 de marzo de 2026
**Lanzamiento objetivo**: 27 de abril de 2026
**Score Go-to-Live**: ~60% → **~82% (actualizado)**

---

## Resumen Ejecutivo

Inmobiq es una plataforma funcionalmente completa con 14 páginas, pipeline de datos robusto, autenticación, y exportaciones. Se realizaron 3 semanas de trabajo de preparación para lanzamiento, cubriendo seguridad, legal, SEO, monitoreo, y polish de UX.

### Lo que ya funciona bien (desde antes)
- Las 14 páginas principales renderizan correctamente
- Dashboard, análisis de zona, comparador, riesgo, portafolio, pipeline, mapa
- Dark mode, responsive, filtros, exports, auth con Google OAuth + email
- TypeScript strict sin errores de build
- Pipeline de datos con validación, dedup, y zone assignment
- RLS habilitado en todas las tablas de Supabase

---

## Avance por Semana

### Semana 1: Seguridad y Legal

| Tarea | Estado | Para qué sirve |
|-------|--------|-----------------|
| Verificar que API keys no están en historial de git | HECHO | Si alguien accede al código, las contraseñas del sistema estarían expuestas. Verificamos que nunca se subieron — estamos seguros. |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | HECHO | Son instrucciones que el servidor le da al navegador para proteger a los usuarios: que no cargue código malicioso, que siempre use conexión segura, que nadie pueda incrustar la plataforma dentro de otro sitio para engañar. |
| Auth en todos los endpoints de exportación | HECHO | Antes, cualquier persona (sin cuenta) podía descargar todos los datos de la plataforma. Ahora solo usuarios con sesión activa pueden exportar. |
| Rate limiting en endpoints críticos | HECHO | Limita cuántas veces alguien puede usar una función por hora (ej: 10 exports/hora). Evita que un bot o usuario abuse del sistema, descargue todo, o tumbe el servidor. |
| Política de Privacidad (`/politica-privacidad`) | HECHO | Es obligatoria por la ley mexicana (LFPDPPP). Le dice al usuario qué datos recopilamos, para qué, y cómo puede pedir que los borremos. Sin esto, la plataforma no puede operar legalmente en México. |
| Términos y Condiciones (`/terminos`) | HECHO | Protege legalmente a Inmobiq. Aclara que los datos son informativos, que no somos valuadores certificados, y limita la responsabilidad si alguien toma malas decisiones de inversión basándose en la plataforma. |
| Footer con links legales | HECHO | Google y la ley esperan que las páginas legales estén accesibles desde cualquier parte del sitio. El footer las muestra en todo momento. |

**Auditoría post-semana 1 — issues encontrados y corregidos:**

| Issue encontrado | Corrección | Para qué sirve |
|------------------|-----------|-----------------|
| CSP tenía `unsafe-eval` innecesario | Removido | `unsafe-eval` le permite a cualquier script ejecutar código arbitrario en el navegador. Mapbox no lo necesita, así que lo quitamos para cerrar esa puerta. |
| CSP no permitía WebSockets de Supabase | Agregado `wss://*.supabase.co` | Si en el futuro activamos notificaciones en tiempo real (ej: alertas de precio instantáneas), necesitan WebSockets. Sin este permiso, el navegador las bloquearía. |
| Rate limiter usaba memoria del servidor | Migrado a base de datos (Supabase) | En Vercel, cada petición puede ir a un servidor diferente. Si el límite está en la memoria de un solo servidor, los otros no se enteran y el límite no funciona. Ahora se guarda en la BD, que es compartida. |
| Doble conexión a BD en endpoint de export | Reutiliza la misma conexión | Abrir dos conexiones a la base de datos cuando solo necesitas una desperdicia recursos y hace las cosas más lentas. |
| Botón de export no mostraba errores al usuario | Ahora muestra mensajes claros | Antes, si el export fallaba, el botón simplemente dejaba de girar y el usuario no sabía qué pasó. Ahora dice "Necesitas iniciar sesión" o "Límite alcanzado, intenta en X minutos". |

---

### Semana 2: Monitoreo, SEO y Error Pages

| Tarea | Estado | Para qué sirve |
|-------|--------|-----------------|
| `robots.txt` | HECHO | Le dice a Google qué páginas puede indexar. Bloqueamos `/admin`, `/api`, `/auth` — no queremos que esas rutas aparezcan en Google porque son internas o privadas. |
| Sitemap dinámico (28 zonas + 9 rutas) | HECHO | Es un mapa del sitio que le entregamos a Google para que sepa exactamente qué páginas existen. Incluye las 28 zonas automáticamente. Ayuda a que cada zona aparezca en búsquedas de Google. |
| Open Graph + Twitter Card meta tags | HECHO | Cuando alguien comparte un link de Inmobiq en WhatsApp, Twitter o LinkedIn, estos tags controlan qué imagen, título y descripción aparecen en la preview. Sin ellos, se ve un cuadro gris sin información. |
| Vercel Analytics integrado | HECHO | Nos permite ver cuántas personas visitan la plataforma, qué páginas ven, y qué tan rápido carga. Es como tener un contador de visitas pero mucho más inteligente. Esencial para tomar decisiones de producto. |
| `/api/health` endpoint | HECHO | Es una URL que simplemente responde "estoy vivo" o "tengo problemas". La usamos para que un servicio de monitoreo (UptimeRobot) nos avise por email/WhatsApp si la plataforma se cae. |
| `error.tsx` (error boundary) | HECHO | Si algo falla inesperadamente en la plataforma, en vez de mostrar una pantalla blanca o un error técnico en inglés, mostramos "Algo salió mal" con un botón de "Intentar de nuevo". Mucho mejor experiencia para el usuario. |
| `not-found.tsx` (página 404) | HECHO | Cuando alguien entra a una URL que no existe (ej: `/zona/narnia`), en vez de ver un error genérico feo, ve una página diseñada con el estilo de Inmobiq que dice "Página no encontrada" y un botón para volver al dashboard. |
| Login con `noindex` | HECHO | Le decimos a Google que no indexe la página de login. No tiene sentido que alguien busque "iniciar sesión inmobiq" y caiga ahí — queremos que encuentren el dashboard o las zonas. |

**Auditoría post-semana 2 — issues encontrados y corregidos:**

| Issue encontrado | Corrección | Para qué sirve |
|------------------|-----------|-----------------|
| CSP bloqueaba Vercel Analytics | Agregado dominio de analytics al CSP | Sin este permiso, el navegador bloquea silenciosamente el envío de datos de analytics. Tendríamos 0 visitas reportadas aunque hubiera miles de usuarios reales. |

**Items pendientes de Semana 2 (requieren acción de Oscar):**

| Item | Por qué es importante |
|------|----------------------|
| Crear `og-image.png` (1200x630px) | Es la imagen que aparece cuando compartes un link en WhatsApp o Twitter. Sin ella, las previews se ven vacías — mala primera impresión. |
| Crear `favicon.ico` | Es el iconito que aparece en la pestaña del navegador junto al nombre de la página. Sin él, se ve un icono genérico — se ve poco profesional. |
| Crear `apple-touch-icon.png` | Cuando alguien guarda Inmobiq como app en su iPhone, este es el icono que aparece. Sin él, iOS toma un screenshot feo de la página. |
| Configurar dominio custom | Ahora el sitio vive en `inmobiq.vercel.app`. Necesitas un dominio propio (`inmobiq.com` o `.mx`) para verse profesional y para que Google lo indexe bien. |
| Configurar UptimeRobot | Es un servicio gratuito que revisa cada 5 minutos si tu sitio está vivo. Si se cae, te manda un email o SMS inmediatamente. Sin esto, podrías estar caído horas sin enterarte. |
| Crear emails de contacto | Las páginas legales dicen "contacto: privacidad@inmobiq.com". Si alguien escribe ahí y no existe el email, pierdes credibilidad y podrías tener problemas legales. |
| Habilitar Vercel Analytics en dashboard | La librería ya está instalada en el código, pero necesitas activarla desde el panel de Vercel. Sin esto, no se recopila nada. |

---

### Semana 3: Polish, Accesibilidad y UX

| Tarea | Estado | Para qué sirve |
|-------|--------|-----------------|
| Dark mode en dropdown de export | HECHO | El menú de "Exportar" se veía con fondo blanco y texto oscuro incluso cuando el usuario tenía el modo oscuro activado. Se veía roto — como si fuera un bug. Ahora se adapta correctamente. |
| Dark mode en dropdown de búsqueda global | HECHO | Mismo problema que el de export: los resultados de búsqueda aparecían en un cuadro blanco brillante en modo oscuro. Ahora se ve bien. |
| Accesibilidad: Icon con `aria-label` | HECHO | Los íconos de la plataforma (flechas, lupas, casitas) son invisibles para personas que usan lectores de pantalla (personas con discapacidad visual). Ahora cada ícono puede tener una descripción que el lector dice en voz alta, y los decorativos se ocultan correctamente. |
| Accesibilidad: Labels en filtros de precio/área | HECHO | Los campos de "precio mínimo", "precio máximo", etc. no tenían etiqueta formal. Un usuario con discapacidad visual que usa lector de pantalla escucharía "campo de texto vacío" sin saber qué poner. Ahora escucha "Precio mínimo" o "Superficie máxima". |
| Flujo de "Olvidé mi contraseña" | HECHO | Antes, si un usuario olvidaba su contraseña, no podía hacer nada — no había ningún link para recuperarla. Ahora hay un link "¿Olvidaste tu contraseña?" que envía un correo con un enlace para crear una nueva. Esto es estándar en cualquier plataforma moderna. |
| Skeleton loaders (componentes de carga) | HECHO | Cuando una página está cargando datos, el usuario veía un espacio vacío o blanco. Ahora ve rectángulos grises animados que simulan la forma del contenido que está por aparecer (como lo hace Instagram, YouTube, etc.). Da la sensación de que la página es más rápida. |

**Items pendientes de Semana 3 (requieren acción de Oscar):**

| Item | Por qué es importante |
|------|----------------------|
| Personalizar email templates en Supabase | El correo de "recuperar contraseña" que recibe el usuario viene con diseño genérico de Supabase. Deberías personalizarlo con el logo y colores de Inmobiq para que se vea profesional y no parezca spam. |
| Configurar redirect URLs en Supabase Auth | Para que el login con Google y el reset de contraseña funcionen en producción, Supabase necesita saber cuál es tu dominio. Si no lo configuras, los usuarios harán click en el link del correo y llegarán a una página de error. |
| Probar flujo completo de password reset | El código está listo, pero necesitas probarlo tú mismo: pedir reset → recibir correo → click en link → verificar que funciona. Es mejor encontrar problemas ahora que el día del lanzamiento. |
| Instalar Sentry | Si algo falla en producción, hoy no nos enteramos. Sentry es un servicio que captura cada error, nos dice qué lo causó, y nos avisa al instante. Sin esto, dependemos de que un usuario nos reporte el problema. |

---

## Plan de Trabajo — Lo que falta (Semana 4 + Buffer)

### Semana 4 (Abr 16 – 22): QA y Launch Prep

| Tarea | Quién | Para qué sirve |
|-------|-------|-----------------|
| Configurar dominio custom en Vercel | Oscar | Para que la plataforma viva en `inmobiq.com` (o el dominio que elijas) en lugar de `inmobiq.vercel.app`. |
| Ejecutar migraciones SQL pendientes | Oscar | Hay tablas y cambios en la base de datos que están escritos pero no se han aplicado. Sin esto, el rate limiting y algunas funciones no funcionan. |
| Run Lighthouse audit | Claude/Oscar | Lighthouse es una herramienta de Google que califica tu sitio en velocidad, accesibilidad, y SEO. Queremos 85+ en todo para que Google nos posicione bien. |
| Test completo en mobile | Oscar | Probar toda la plataforma en un celular real (iPhone Safari y Android Chrome). Algunos bugs solo aparecen en mobile. |
| Test de auth flow | Oscar | Probar registro, login con Google, login con email, logout, y que las páginas protegidas redirijan correctamente. |
| Test de exports | Oscar | Probar que los PDFs, Excel y CSV se descarguen correctamente y tengan datos reales, no vacíos. |
| Verificar scraping en producción | Oscar | Confirmar que el sistema de recopilación de datos funciona desde el servidor de producción y que los datos se actualizan. |

### Buffer (Abr 23 – 26): Fixes finales

| Tarea | Para qué sirve |
|-------|-----------------|
| Fix bugs de QA | Corregir todo lo que se encuentre roto en las pruebas de la semana 4. |
| Performance tuning | Optimizar las páginas más lentas si Lighthouse indica problemas. |
| Preparar comunicación de lanzamiento | Tener listo el correo, video, y materiales para el 27 de abril. |

---

## Estado Actual de Cada Área

### Seguridad
| Item | Antes | Ahora | Nota |
|------|-------|-------|------|
| Security headers | No existían | 7 headers configurados | Protegen al navegador del usuario |
| Auth en exports | Solo 2 de 3 tenían auth | Los 3 endpoints protegidos | Nadie sin cuenta puede descargar datos |
| Rate limiting | No existía | 5 endpoints limitados | Evita abuso y sobrecarga |
| API keys en git | Sin verificar | Verificado — nunca se subieron | Las contraseñas del sistema están seguras |

### Legal
| Item | Antes | Ahora |
|------|-------|-------|
| Política de Privacidad | No existía | Publicada en `/politica-privacidad` |
| Términos y Condiciones | No existía | Publicados en `/terminos` |
| Footer con links | No existía | Visible en todas las páginas |

### SEO
| Item | Antes | Ahora |
|------|-------|-------|
| robots.txt | No existía | Creado, bloquea rutas privadas |
| Sitemap | No existía | Dinámico, 37 URLs (28 zonas + 9 páginas) |
| Open Graph tags | No existían | En root layout y páginas de zona |
| Twitter Cards | No existían | Configuradas |
| Login noindex | No tenía | Login oculto de Google |
| og-image.png | No existe | **PENDIENTE OSCAR** |
| favicon.ico | No existe | **PENDIENTE OSCAR** |

### Monitoreo
| Item | Antes | Ahora |
|------|-------|-------|
| Vercel Analytics | No existía | Instalado e integrado |
| Health endpoint | No existía | `/api/health` funcional |
| Error boundary | No existía | Página de error amigable |
| 404 page | Genérica de Next.js | Personalizada con branding |
| Sentry | No existe | **PENDIENTE OSCAR** |
| UptimeRobot | No existe | **PENDIENTE OSCAR** |

### UX / Accesibilidad
| Item | Antes | Ahora |
|------|-------|-------|
| Dark mode en dropdowns | Roto (fondo blanco) | Corregido |
| Icons para lectores de pantalla | Invisibles | Tienen aria-label |
| Labels en filtros | Faltaban | Todos los inputs tienen label |
| Password reset | No existía | Flujo completo implementado |
| Skeleton loaders | No existían | Componentes reutilizables creados |
| Export error feedback | Solo console.log | Mensajes visibles al usuario |

---

## Servicios Externos

| Servicio | Para qué lo usamos | ¿Qué pasa si falla? |
|----------|--------------------|--------------------|
| Supabase | Base de datos y login de usuarios | La plataforma no funciona — es el corazón del sistema |
| Mapbox | Los mapas interactivos de Tijuana | Se muestra "Cargando mapa..." — el resto del sitio sigue funcionando |
| Anthropic (Claude) | Genera insights inteligentes sobre las zonas | Se muestran insights estáticos — no es crítico |
| Apify | Recopila datos de los portales inmobiliarios | Se puede scrappear manualmente — los datos existentes no se pierden |
| Google OAuth | Login con cuenta de Google | El usuario puede usar email y contraseña como alternativa |
| Vercel | El servidor donde vive la plataforma | Si Vercel se cae, la plataforma se cae — pero tienen 99.99% uptime |

---

## Migraciones SQL Pendientes

Estos archivos contienen cambios a la base de datos que necesitan ejecutarse manualmente en Supabase:

| Archivo | Para qué sirve | Cómo ejecutarlo |
|---------|-----------------|-----------------|
| `PENDING_run_in_sql_editor.sql` | Crea las tablas base que faltan y los índices de rendimiento | Supabase Dashboard → SQL Editor → pegar contenido → Run |
| `20260325_rate_limits.sql` | Crea la tabla que almacena los contadores de rate limiting | Mismo procedimiento |

**Sin ejecutar estas migraciones, el rate limiting no funciona en producción.**

---

*Documento generado el 25 de marzo de 2026 por Claude Code*
*Última actualización: 25 de marzo de 2026 — refleja avance de semanas 1-3*
