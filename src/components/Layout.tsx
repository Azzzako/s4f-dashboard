import { Flag, History, Image, LayoutDashboard, LogOut, MapPin, Menu, MessageSquareText, X } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { usePendingCounts } from '../lib/queries'
import type { PendingCounts } from '../lib/types'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  count?: keyof PendingCounts
}

const nav: NavItem[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/spots', label: 'Spots', icon: MapPin, count: 'spots' },
  { to: '/reviews', label: 'Reseñas', icon: MessageSquareText, count: 'ratings' },
  { to: '/photos', label: 'Fotos', icon: Image, count: 'photos' },
  { to: '/reports', label: 'Reportes', icon: Flag, count: 'reports' },
  { to: '/audit', label: 'Auditoría', icon: History },
]

export function Layout() {
  const { state, signOut } = useAuth()
  const { data: counts } = usePendingCounts()
  const [open, setOpen] = useState(false)
  const username = state.status === 'admin' ? state.username : ''

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">S4F</span>
        <span className="font-semibold">Admin</span>
      </div>
      {nav.map(({ to, label, icon: Icon, count }) => {
        const n = count ? (counts?.[count] ?? 0) : 0
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`
            }
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {n > 0 && (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white">
                {n}
              </span>
            )}
          </NavLink>
        )
      })}
      <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="truncate px-3 text-xs text-zinc-500">Sesión: {username}</p>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-zinc-200 bg-white lg:block dark:border-zinc-800 dark:bg-zinc-900">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900">
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute top-4 right-4 text-zinc-500">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/80">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">S4F Admin</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
