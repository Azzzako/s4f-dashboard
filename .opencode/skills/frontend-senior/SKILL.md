---
name: frontend-senior
description: Use when designing or implementing UI components, choosing frontend libraries, or making architectural UX decisions for the S4F dashboard. Provides senior frontend engineer perspective on accessibility, performance, scalability, and best practices.
---

# Frontend Senior Dev

Apply this mindset whenever you're touching UI in this project. It encodes how a senior engineer who has shipped React at scale would think about every change.

## Accessibility is not optional

- Every interactive element must be keyboard-navigable (tab order, visible focus, Enter/Space activation).
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`, `<dialog>`) before reaching for ARIA.
- Form fields need labels — visible `<label>` or `aria-label`, never just a placeholder.
- Color contrast ≥ WCAG AA (4.5:1 for body text, 3:1 for large).
- Modals: trap focus, restore focus to opener on close, close on Escape, close on backdrop click. (We already do this — keep doing it.)
- Dynamic content (toasts, errors, live counts) needs `aria-live` or visual cues that don't depend on color alone.

## Performance

- Lazy-load heavy libraries (recharts, etc.) with `React.lazy` + `Suspense`. Don't pay the cost on the login page.
- Memoize only when measured to be a bottleneck. Premature `useMemo` / `useCallback` adds complexity.
- Avoid `useEffect` for derived state — compute during render.
- Avoid inline objects/arrays in dependency arrays; that creates new references every render.
- Use `<picture>` or responsive `<img>` for images; `loading="lazy"` for off-screen.

## Scalable component patterns

- **Composition over configuration.** Small composable primitives beat large configurable ones. Our `Button`, `Card`, `Modal`, `ReasonDialog` are the right shape.
- **Colocate state with the component that uses it.** Lift only when shared. We're already good about this.
- **Custom hooks for shared logic.** We have `useModeration`, `useSearchParam`, `useRealtime`, `usePagination`. Add more as patterns emerge.
- **Render props / children for flexibility** when slots would feel rigid.
- **Discriminated unions for variants** (we use string literal unions — fine for this scale).

## When to extract a component

Extract when ANY of these is true:

- Used in 3+ places
- Has its own state
- Has its own behavior beyond visuals
- Helps the parent reason about itself

Otherwise keep it inline — premature extraction hurts readability.

## When to use a library

Use a library when:
- The problem is hard and well-solved (date pickers, charts, rich text)
- Building it would take longer than maintaining the dep
- The lib is actively maintained, small, tree-shakeable

Don't use a library when:
- It's bigger than the problem (we don't need a full UI kit for one button)
- It locks us into a paradigm we don't want
- We can build it in <50 lines and it would be more flexible

Examples we got right: recharts for the overview charts. Examples we got right by NOT adding one: keeping our own Modal instead of pulling in headlessui or radix.

## Style discipline

- Tailwind utility-first. No inline `style={}` unless dynamic.
- Don't reach for `@apply` to extract clusters — extract a component instead.
- Stick to Tailwind's default spacing scale (4/8/12/16). Don't introduce arbitrary values.
- Dark mode: design and test for BOTH modes. Don't ship one and assume the other works.
- Brand color (`brand-500`) is the accent. Don't dilute it with arbitrary oranges.

## Decision-making

- **Boring beats clever** unless there's a real reason to be clever.
- **Optimistic UI** for mutations that almost always succeed (we use toast.success + invalidate).
- **Skeleton states** for loading, not spinners — unless the wait is <200ms.
- **Error states must include a retry path.** (We have `onRetry` in `QueryState`.)
- **Empty states** should explain why it's empty and what to do.

## Red flags in code review

- `any` types — push for proper types
- `dangerouslySetInnerHTML` — almost always wrong
- Unhandled promise rejections
- Missing `key` on lists (or using index as key when list reorders)
- Inline functions in dependency arrays
- `useEffect` that just sets state (should be derived)
- `<button>` without `type="button"` inside a `<form>` (we had this in `Layout`)
- `console.log` of anything that smells like a secret or PII

## Apply without being asked

When you propose a UI change, briefly say which principle motivated the choice. One sentence is enough.
