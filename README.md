# S4F Admin Dashboard

Panel web de moderación para **Spot For Fun**. Aprueba o rechaza spots, reseñas y fotos, atiende reportes y gestiona quién tiene permisos de admin. Los cambios se reflejan en la app al instante porque ambos usan el mismo proyecto de Supabase.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (con `@custom-variant dark` para tema por clase)
- TanStack Query (cache, refetch, mutaciones)
- supabase-js (auth + PostgREST + RPC + Realtime)
- react-router, sonner (toasts), lucide-react (iconos)

## Modelo de seguridad

- Usa **solo la publishable key**. Nunca pongas la `service_role` en este proyecto: todo lo que empieza con `VITE_` queda dentro del bundle público.
- El login verifica `profiles.role = 'admin'`. Eso es solo UX; el control real está en la base:
  - **Lecturas:** las policies RLS dan acceso completo a quien pasa `public.is_admin()`.
  - **Escrituras:** las RPC `security definer` de las migraciones `0019_admin_moderation_rpc.sql` y siguientes (repo `spot_for_fun`). Cada una revisa `is_admin()`, aplica el cambio y deja registro en `admin_audit_log`, todo en una transacción.
- Las notificaciones a los usuarios (spot, reseña o foto aprobada o rechazada) salen de triggers en la base, no del dashboard.

## Requisitos

1. Migraciones de `spot_for_fun/supabase/migrations` aplicadas hasta la **0021**.
2. Una cuenta con `role = 'admin'` en `public.profiles`.

## Migraciones nuevas (este repo)

Este repo incluye los archivos SQL listos para copiarse al repo `spot_for_fun` y aplicarse:

| Archivo | Qué añade |
| --- | --- |
| `supabase/migrations/0020_admin_enhancements.sql` | Parámetro `p_reason` en `admin_set_report_status` y las 4 RPCs bulk (`admin_set_*s_status`). |
| `supabase/migrations/0021_admin_user_management.sql` | `admin_list_users`, `admin_set_user_role` (con protección de auto-demote). |

## Desarrollo

```bash
cp .env.example .env.local   # llena VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173 (Vite default)
```

## Puertos

| Comando | Puerto | Notas |
| --- | --- | --- |
| `npm run dev` | **5173** | Default de Vite. Para trabajar en `dev`. |
| `npm run preview` (y pm2) | **7777** | Loopback (`127.0.0.1`). Producción. |

## Workflow de ramas

| Rama | Para qué sirve |
| --- | --- |
| `dev` | Trabajo de features. Aquí se hacen los PRs de `feature/*`. |
| `main` | Producción. Solo recibe merges desde `dev`. Cada merge redespliega. |

```bash
# Empezar una feature
git checkout dev
git checkout -b feature/mi-cambio
# ...trabajo...
git commit -am "feat: mi cambio"
git checkout dev && git merge --no-ff feature/mi-cambio
git branch -d feature/mi-cambio

# Cuando esté listo para producción, avisame con "push a main".
# Yo me encargo de: mergear dev → main, pushear a origin y correr npm run deploy.
```

## Despliegue local con pm2

El dashboard vive en `http://127.0.0.1:7777` (loopback, no expuesto en red) bajo pm2.

**Primer arranque** (instala pm2 si falta, compila y deja el proceso corriendo):

```bash
npm run setup
# luego (opcional, una vez):
pm2 startup    # te mostrará un comando sudo, cópialo y ejecútalo
# para que arranque al prender la Mac
```

**Redesplegar** después de mergear a main:

```bash
npm run deploy
```

**Comandos pm2 útiles:**

```bash
pm2 logs s4f-admin      # logs en vivo
pm2 restart s4f-admin   # reiniciar
pm2 stop s4f-admin      # detener
pm2 status              # procesos activos
pm2 delete s4f-admin    # eliminar el proceso
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm run lint` | oxlint |

## Deploy

Es una SPA estática. `vercel.json` ya incluye el rewrite a `index.html` y headers de seguridad (sin iframes, `noindex`). En Netlify o Cloudflare Pages replica ambos.

Configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el proveedor, y agrega el dominio del dashboard en Supabase → Authentication → URL Configuration.

## Estructura

```
src/
  auth/        sesión + gate de admin
  components/  layout, UI compartida, skeletons, modales
  lib/         cliente Supabase, API (lecturas + RPC + realtime), tipos, hooks
  pages/       Resumen, Spots, Reseñas, Fotos, Reportes, Auditoría,
               Administradores, Ajustes, ResetPassword
```

## Funcionalidades clave

- **Búsqueda libre** en Spots (nombre/descripción), Reseñas (comentarios), Reportes (motivo), Administradores (email/usuario)
- **Filtros** de tipo y dificultad en Spots; filtro por tipo de acción en Auditoría
- **Paginación** "Cargar más" en todas las listas (`.range()` + botón)
- **Acciones en lote** con checkbox por item + barra flotante (aprobar/rechazar)
- **Tiempo real** vía `supabase.channel` + `postgres_changes` en todas las tablas moderadas
- **URL-state**: tabs, búsqueda y filtros viven en query params (deep-link friendly)
- **Tema** claro / oscuro / sistema con persistencia en localStorage
- **Settings**: cambio de contraseña, selector de tema, datos de cuenta
- **Gestión de admins** desde `/admins`: buscar usuarios, promover/quitar rol (con protección de auto-demote)
- **Reset de contraseña** desde el login (link por email) y desde Ajustes
- **ErrorBoundary** con recuperación + botón "Reintentar" en `QueryState`
- **Skeletons** para listas, grids y tablas durante la carga inicial
- **Focus management** en modales (devuelve foco al disparador)