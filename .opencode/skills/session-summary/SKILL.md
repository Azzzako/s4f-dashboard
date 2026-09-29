---
name: session-summary
description: Use at the end of a session or before pushing to main. Updates contexto.md with the current state, recent decisions, and next steps so the next session starts informed without re-asking.
---

# Session Summary

Update `contexto.md` to reflect the current state. Goal: someone (you, the next session, on another machine) can open this file alone and know exactly where the project is.

## When to use

- Before pushing to main (mandatory step in the deploy workflow)
- At the end of a session if no push happens
- When the user explicitly asks for a summary
- After any decision that future sessions would need to know about

## Process

1. Read the current `contexto.md` to see what's already there.
2. Run `git log --oneline -20` and `git status` to see recent commits and any uncommitted work.
3. Run `git branch -v` for the current branch state.
4. Run `pm2 status s4f-admin 2>/dev/null` for deploy state (pid, uptime).
5. Run `npm test 2>&1 | tail -3` and `npm run build 2>&1 | tail -3` to confirm both still pass.
6. Update `contexto.md` in place, focusing on the sections that actually changed.

## Sections to update

| Section | When to update |
| --- | --- |
| **§11 Estado actual** | Every time. Branches, last deploy commit, pm2 pid/uptime. |
| **§13 Bugs / decisiones** | When a non-obvious decision was made this session. |
| **§14 Lo que queda pendiente** | Tick off completed items, add new ones. |
| **§8 Estructura** | Only when files/folders are added or removed. |
| **§10 Features clave** | When a new feature ships. |
| **§17 Agentes / Skills** | When skills or commands are added/changed. |

Sections that rarely change: §1-§7, §9, §12, §15-§16. Leave them alone.

## Update rules

- **Surgical edits only.** Don't rewrite the whole file.
- **Spanish.** Match the rest of the document.
- **Code references** use `path:line` format.
- **Bullet items** keep the same style as neighbors.
- **Date markers** for important decisions: `> 2025-04-23:` if useful.

## What NOT to do

- Don't include secrets, tokens, or `.env` values.
- Don't add narrative or storytelling — facts only.
- Don't change the section count or ordering without strong reason.
- Don't duplicate info that's already in `README.md` — reference instead.
- Don't bloat. If something isn't useful for the next session, leave it out.

## After updating

1. `git add contexto.md`
2. Commit: `docs: update contexto.md from session summary`
3. Tell the user what was updated in one sentence per section touched.

## Example diff

```diff
 ## 11. Estado actual

-**Último deploy:** login rediseñado (split-screen corporativo) + config de puertos
+**Último deploy:** 3 skills en `.opencode/skills/` (frontend-senior, cybersecurity, session-summary)
+**pm2 pid:** 35461 (uptime ~3 días)

 ## 14. Lo que queda pendiente

-1. **Completar i18n** — extraer todos los strings inline a `t_(...)`
+1. ~~**Completar i18n**~~ — hecho en sesión X
+2. **Code splitting** — recharts pesa, lazy-load
```
