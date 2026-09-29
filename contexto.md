# contexto.md

Contexto vivo del proyecto **S4F Admin Dashboard**. Léeme al empezar una sesión nueva en cualquier dispositivo — explica qué es, qué hay hecho, cómo se trabaja y qué falta.

> Este archivo es **documentación**, no código. Vive en la raíz del repo y se publica en GitHub a propósito para que puedas consultarlo desde otra máquina.

---

## 1. Qué es

Panel web de moderación para **Spot For Fun** (app de skate spots). Aprobar / rechazar spots, reseñas, fotos y reportes; gestionar quién tiene rol de admin.

**Vive en** `http://127.0.0.1:7777` (loopback, nunca expuesto a LAN). Se sirve desde `dist/` con `vite preview` bajo pm2.

---

## 2. Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (con `@custom-variant dark` para tema por clase)
- TanStack Query (cache, refetch, mutaciones, real-time)
- supabase-js (auth + PostgREST + RPC + Realtime)
- react-router, sonner (toasts), lucide-react (iconos)
- Vitest + @testing-library/react + happy-dom (tests)

---

## 3. Puertos y comandos

| Comando | Puerto | Uso |
| --- | --- | --- |
| `npm run dev` | **5173** | Trabajar en `dev` (Vite default, hot reload). |
| `npm run preview` | **7777** | Servidor de producción estático. Es el que corre pm2. |
| `npm run build` | — | Typecheck + build → `dist/`. |
| `npm run test` | — | Suite Vitest (36 tests al cierre de esta sesión). |
| `npm run lint` | — | oxlint. |
| `npm run deploy` | — | Rebuild + `pm2 restart s4f-admin`. Lo corre quien dice "push a main". |
| `npm run setup` | — | Setup inicial: instala pm2 si falta, build, start. |

Hostname siempre `127.0.0.1` (loopback). La red nunca lo ve.

---

## 4. Workflow de ramas y deploy

```
feature/*  ─merge─►  dev  ─"push a main"─►  main  +  push origin  +  npm run deploy
```

- **`dev`** — trabajo diario. Las features van aquí.
- **`main`** — producción. Cada merge redespliega pm2.
- El remoto es GitHub (`origin`), pero el dashboard **solo se sirve en local**.
- Las migraciones SQL viven en `spot_for_fun/supabase/migrations/` (otro repo). Este dashboard solo trae copias en `supabase/migrations/` para referencia.

**Para desplegar:** el usuario dice "push a main" y yo:
1. `git checkout main && git merge --no-ff dev`
2. `git push origin main`
3. `npm run deploy`

**pm2 ya está corriendo** como `s4f-admin` desde la primera sesión. Si reinicias la Mac, vuelve con `pm2 resurrect` (si configuraste `pm2 startup`).

---

## 5. Variables de entorno

`.env.local` (ignorado por git) tiene:

```
VITE_SUPABASE_URL=https://cbnfotjvtjkmhfamuhep.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sin `.env.example` modificado: ambos nombres deben empezar con `VITE_` para que Vite los inyecte al bundle.

---

## 6. Modelo de seguridad (importante)

- El dashboard usa **solo la publishable key**. Nunca `service_role` en el bundle público.
- El login verifica `profiles.role = 'admin'`. Es solo UX; el control real es:
  - **Lecturas:** policies RLS pasan a quien cumple `public.is_admin()`.
  - **Escrituras:** RPCs `security definer` (migraciones 0019 → 0021) que revisan `is_admin()` server-side y registran cada acción en `admin_audit_log`.

---

## 7. Migraciones necesarias en `spot_for_fun`

Este dashboard referencia estas migraciones pero **no las ejecuta** — viven en el otro repo:

| Archivo en este repo | Contenido |
| --- | --- |
| `supabase/migrations/0020_admin_enhancements.sql` | `p_reason` en `admin_set_report_status` + 4 RPCs bulk (`admin_set_spots_status`, `admin_set_ratings_status`, `admin_set_photos_status`, `admin_set_reports_status`). |
| `supabase/migrations/0021_admin_user_management.sql` | `admin_list_users`, `admin_set_user_role` (auto-demote bloqueado). |

Aplicar después de la **0019**. Sin esto, las acciones en bulk, el motivo en "Descartar reporte" y la gestión de admins no funcionan.

---

## 8. Estructura del repo

```
src/
  auth/                 AuthProvider, contexto, hook useAuth
  components/           UI compartida: Button, Card, Tabs, Modal, ReasonDialog,
                        Lightbox, ErrorBoundary, BulkBar, SearchInput, Skeleton,
                        Checkbox, ConfirmDeleteDialog, DateRangeFilter,
                        ThemeProvider, UserLine
  lib/
    supabase.ts          cliente + isSupabaseConfigured
    api.ts               lecturas + RPCs individuales + bulk (0020)
    csv.ts               export a CSV (sin deps)
    analytics.ts         agregaciones para Overview (dailyActions, actionMix, topModerators)
    i18n.ts              diccionario es (foundation, Layout ya traducido)
    realtime.ts          suscripciones postgres_changes
    useModeration.ts     wrapper mutation + toast + invalidación selectiva
    useSearchParam.ts    URL state para tabs / filtros / paginación
    format.ts             timeAgo, formatDate, labels
    queries.ts            usePendingCounts
    types.ts              enums + interfaces de cada entidad
  pages/                OverviewPage, SpotsPage, ReviewsPage, PhotosPage,
                        ReportsPage, AuditPage, AdminUsersPage,
                        SettingsPage, LoginPage, ResetPasswordPage
  test/                 setup.ts (vitest)
supabase/migrations/    copias de referencia de las SQL del repo principal
scripts/                setup.sh, deploy.sh
```

---

## 9. Páginas y qué hace cada una

| Ruta | Página | Función |
| --- | --- | --- |
| `/` | `OverviewPage` | 4 contadores pendientes + 3 charts (recharts): actividad 30d, mix por tipo, top moderadores. |
| `/spots` | `SpotsPage` | Spots por status (pending/approved/rejected). Filtros: búsqueda, tipo, dificultad, rango de fechas. Bulk approve/reject. Acciones individuales: aprobar, rechazar, eliminar (con re-auth de password). |
| `/reviews` | `ReviewsPage` | Reseñas por status. Búsqueda por comentario, filtro por fecha. Bulk approve/reject. |
| `/photos` | `PhotosPage` | Fotos por status. Filtro por fecha. Bulk approve/reject. |
| `/reports` | `ReportsPage` | **Agrupado por spot** (varios reportes del mismo spot se colapsan). Acciones por grupo: descartar / despublicar / eliminar spot. Bulk dismiss. |
| `/audit` | `AuditPage` | Log de admin_audit_log. Filtro por tipo de acción. Export CSV. Paginación. |
| `/admins` | `AdminUsersPage` | Lista de usuarios. Buscar, promover / quitar admin. Auto-demote bloqueado. |
| `/settings` | `SettingsPage` | Cambio de contraseña, selector de tema, datos de cuenta. |
| `/login`, `/reset-password` | `LoginPage`, `ResetPasswordPage` | Diseño split-screen corporativo (panel oscuro + form). |

---

## 10. Features clave

- **Búsqueda** (debounced 300ms) en spots / reseñas / reportes / admins
- **Filtros**: tipo y dificultad en spots; rango de fechas (YYYY-MM-DD) en las 4 entidades; tipo de acción en audit
- **Paginación** "Cargar más" con `.range()` (25-50 por página según entidad)
- **Bulk actions**: checkbox por item + `BulkBar` flotante (sticky bottom)
- **Real-time**: `supabase.channel('postgres_changes')` para spots / ratings / photos / reports / audit log. Invalida queries en cada evento.
- **URL state**: tabs / búsqueda / filtros / paginación viven en query params (deep-linkeables)
- **Tema** claro / oscuro / sistema, persistido en localStorage con script anti-FOUC en `index.html`
- **Re-autenticación** para eliminar spot: `ConfirmDeleteDialog` valida la contraseña con `signInWithPassword` antes de proceder
- **ErrorBoundary** + botón "Reintentar" en `QueryState`
- **Skeletons** para cards / grids / photos / tables (en vez de spinner)
- **Charts** en Overview (recharts): line, pie, stacked bar
- **Export CSV** del audit log
- **i18n**: diccionario `es` listo en `src/lib/i18n.ts`; Layout ya lo usa. El resto de strings sigue inline.
- **Tests**: 36 tests (format, useModeration, QueryState, ReasonDialog, SearchInput, csv, analytics)

---

## 11. Estado actual (al cierre de esta sesión)

**Ramas:**
- `main` ← en producción (sirviendo en `localhost:7777`), commit `4a84203`
- `dev` ← alineado con `main`

**pm2:**
- Proceso `s4f-admin` corriendo, pid `38900`

**Último deploy:** contexto.md + 3 skills (frontend-senior, cybersecurity, session-summary) + 2 comandos

---

## 12. Convenciones del código

- TypeScript estricto, `noUnusedLocals` y `noUnusedParameters` activos
- Sin comentarios en el código a menos que expliquen el "por qué" de una decisión no obvia
- Estilos con Tailwind, clases utility. Sin styled-components ni CSS-in-JS
- Componentes funcionales, hooks nombrados `use*`
- Sin tests E2E todavía (solo unitarios)
- Idiomas: copy en español, código/identificadores en inglés
- Commits: estilo conventional (`feat:`, `chore:`, `style:`, `merge:`)

---

## 13. Bugs / decisiones que vale recordar

- `useModeration` invalida solo los query keys provistos (no todo por defecto). Pásalo explícito para evitar refetch innecesario.
- `ReasonDialog` resetea el `textarea` cuando `open` pasa de `false` a `true` (bug original: el texto se quedaba entre usos).
- `ReportsPage` agrupa por spot_id. Cuando eliminas un spot desde un reporte, **también** se cierra el reporte (status='reviewed').
- "Descartar reporte" ahora pide motivo via `ReasonDialog` (antes era sin razón).
- `<dialog>` nativo se cierra con Escape → `onClose` se llama; el focus vuelve al botón que lo abrió (capturado en `lastFocused.current`).

---

## 14. Lo que queda pendiente (cuando haya ganas)

1. **Completar i18n** — extraer todos los strings inline a `t_(...)` (ahora solo Layout está traducido)
2. **Code splitting** — bundle pasó de ~500KB por ~1MB al meter recharts. Usar `dynamic import()` para OverviewPage (lazy-load recharts)
3. **Tests E2E** (Playwright) — smoke del flujo login → aprobar spot → ver audit
4. **Más métricas** en Overview — series semanales, top reporteros, etc.
5. **Drag-to-select** para bulk (en vez de checkbox por item)

---

## 15. Comandos útiles pm2

```bash
pm2 status s4f-admin         # estado del proceso
pm2 logs s4f-admin           # logs en vivo
pm2 restart s4f-admin        # reiniciar (deploy lo hace solo)
pm2 stop s4f-admin           # detener
pm2 delete s4f-admin         # eliminar el proceso
pm2 save                     # persistir lista de procesos
pm2 resurrect                # restaurar lista después de reiniciar la Mac
```

Si `pm2 startup` no se ha corrido todavía y reinicias la Mac, el proceso no vuelve solo. Hay que correrlo y seguir las instrucciones con `sudo`.

---

## 16. Si abres este proyecto en otra máquina

1. `git clone` el repo
2. `cd s4f-dashboard`
3. `cp .env.example .env.local` y pegar las credenciales de Supabase (no commiteadas)
4. `npm install`
5. `npm run dev` para trabajar (5173)
6. Si quieres servirlo en 7777 como producción local: `npm run setup`

El archivo `.env.local` **no está en git** — tienes que copiarlo a mano en cada máquina.

---

## 17. Agentes / skills disponibles

Definidos en `.opencode/skills/` (proyecto) — se cargan al iniciar opencode.

| Skill | Cuándo se invoca | Qué hace |
| --- | --- | --- |
| `frontend-senior` | Trabajando en UI/UX | Mindset de senior frontend: accesibilidad, performance, escalabilidad. |
| `cybersecurity` | Antes de push a main, cambios en auth/RPC | Checklist de seguridad con severidad y fixes concretos. |
| `session-summary` | Antes de push a main, fin de sesión | Actualiza este `contexto.md` con el estado actual. |

**Comandos explícitos** en `.opencode/command/`:

| Comando | Qué hace |
| --- | --- |
| `/security-review` | Corre el checklist de cybersecurity sobre los cambios actuales (read-only). |
| `/session-summary` | Actualiza `contexto.md` con el estado actual. |

### Flujo "push a main"

Cuando dices "push a main", yo ejecuto en orden:

1. **Security review** → corre checklist, reporta hallazgos. Si hay Critical/High, BLOQUEA el push hasta arreglar.
2. **Session summary** → actualiza `contexto.md` con el estado del deploy (ramas, commit, pid pm2, tests, build).
3. `git checkout main && git merge --no-ff dev`
4. `git push origin main`
5. `npm run deploy` (rebuild + `pm2 restart s4f-admin`)