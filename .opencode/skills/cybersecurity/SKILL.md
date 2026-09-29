---
name: cybersecurity
description: Use before pushing to main, when reviewing security-sensitive changes (auth, RPCs, RLS, password handling), or when adding new data flows. Security audit checklist for a Supabase-backed React app.
---

# Cybersecurity Review

Run this checklist **before merging to main**. It produces a numbered report with severity and concrete fixes. Block the deploy if any Critical or High finding is unresolved.

## Scope

This dashboard uses Supabase publishable key only. The actual security boundary is:
- **RLS policies** for reads
- **`security definer` RPCs** that check `public.is_admin()` for writes
- **Auth sessions** via supabase-js

Anything outside that boundary is the other repo's problem (the `spot_for_fun` backend).

## Checklist

Run these and report what you find.

### 1. Secrets in code

```bash
git diff main -- src/ supabase/
git grep -nE "(password|secret|token|api_key|apikey|service_role|Bearer)\s*[:=]\s*['\"][^'\"]+['\"]"
git ls-files | grep -E "\.env($|\.)"
```

Verify:
- `.env*` files are listed in `.gitignore` (except `.env.example`).
- No hardcoded secrets, test tokens, or production URLs in source.
- The publishable key in `.env.local` is never committed.

### 2. Dependency vulnerabilities

```bash
npm audit --omit=dev
```

Block on Critical or High. Medium and Low can be reported as advisories.

### 3. Supabase client posture

- `src/lib/supabase.ts` uses ONLY the publishable key — never `service_role`.
- Sensitive writes (`spots`, `spot_ratings`, `spot_photos`, `spot_reports`, `profiles`, `admin_audit_log`) go through RPCs, not raw `from(...).update/insert/delete`.
- Any new RPC file in `supabase/migrations/` declares `security definer` and checks `is_admin()`.
- No client-side code path can mutate auth state in unexpected ways (e.g., no manual `setSession` calls with attacker-controlled tokens).

### 4. RLS posture (sample only — backend repo)

We can't audit backend migrations from here. Spot-check:
- `is_admin()` is the only path used by admin RPCs.
- New tables referenced from RPCs have at least `using (false)` default policies.
- No `using (true)` policies on sensitive tables.

### 5. Auth flow

- `signInWithPassword` errors are sanitized (we show "Credenciales inválidas." not the raw error).
- `signOut` clears local state.
- Password reset `redirectTo` points to the current origin (no open redirect).
- No session token written to `localStorage` outside supabase-js's own key.
- `resetPasswordForEmail` is only callable while signed out.

### 6. Input validation

- All form inputs validated client-side (length, type, format).
- Server-side RPCs re-validate (`if not (...) raise exception`).
- No `eval`, `Function()`, or `dangerouslySetInnerHTML` anywhere in `src/`.

### 7. Output encoding

- React escapes by default. Verify no `dangerouslySetInnerHTML` in src.
- User-supplied strings used in `aria-label`, `title`, or `alt` are escaped.
- Dynamic URLs (`href`) are constructed from validated values, not raw user input.

### 8. CSRF / Origin

- Supabase handles CSRF for auth flows.
- RPCs rely on the user's session JWT (RLS + `is_admin`). No CSRF needed for this model.

### 9. Logging

- No `console.log` of user data, tokens, passwords, or session info.
- `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) logs errors — confirm no PII leaks.

### 10. Public exposure

- `index.html` has `<meta name="robots" content="noindex, nofollow" />` (admin only).
- `vercel.json` (if used) sets `X-Frame-Options: DENY` or equivalent.
- No public form posts without rate limiting (this app is admin-only, so N/A — but note any new public endpoint).

## Output format

Use this exact structure in your response to the user:

```
## Security Review

### Findings
- [SEVERITY] <one-line title>
  File: path:line
  Issue: <what's wrong>
  Fix: <concrete change>

### Summary
- Critical: 0
- High: 0
- Medium: 0
- Low: 0

### Verdict
[BLOCK / PROCEED] — <one-sentence reason>
```

## Behavior rules

- **Be specific.** Point at file:line, not "somewhere in src/".
- **Be concrete.** A fix should be copy-pasteable code or config.
- **Don't false-positive.** If something looks weird but is actually fine (e.g., `password` substring in a test fixture), say so explicitly.
- **Run the checklist mechanically.** Don't skip steps because they "look clean".
- **If you find nothing**, say so and end with PROCEED. Don't invent issues to look thorough.

## When invoked

Run this checklist automatically:
- Before every "push to main" the user requests
- After any change to `src/lib/supabase.ts`, `src/lib/api.ts`, `src/auth/`, or `supabase/migrations/`
- When the user explicitly asks for a security review
