# S4F Admin Dashboard

Panel web de moderación para **Spot For Fun**. Aprueba o rechaza spots, reseñas y fotos, y atiende reportes. Los cambios se reflejan en la app al instante porque ambos usan el mismo proyecto de Supabase.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- TanStack Query (cache, refetch, mutaciones)
- supabase-js (auth + PostgREST + RPC)
- react-router, sonner (toasts), lucide-react (iconos)

## Modelo de seguridad

- Usa **solo la publishable key**. Nunca pongas la `service_role` en este proyecto: todo lo que empieza con `VITE_` queda dentro del bundle público.
- El login verifica `profiles.role = 'admin'`. Eso es solo UX; el control real está en la base:
  - **Lecturas:** las policies RLS dan acceso completo a quien pasa `public.is_admin()`.
  - **Escrituras:** las RPC `security definer` de la migración `0019_admin_moderation_rpc.sql` (repo `spot_for_fun`). Cada una revisa `is_admin()`, aplica el cambio y deja registro en `admin_audit_log`, todo en una transacción.
- Las notificaciones a los usuarios (spot, reseña o foto aprobada o rechazada) salen de triggers en la base, no del dashboard.

## Requisitos

1. Migraciones de `spot_for_fun/supabase/migrations` aplicadas hasta la **0019**.
2. Una cuenta con `role = 'admin'` en `public.profiles`.

## Desarrollo

```bash
cp .env.example .env.local   # llena VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173
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
  components/  layout y UI compartida
  lib/         cliente Supabase, API (lecturas + RPC), tipos, helpers
  pages/       Resumen, Spots, Reseñas, Fotos, Reportes, Auditoría
```
