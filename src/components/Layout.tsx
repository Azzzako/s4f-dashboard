import { Flag, History, Image, LayoutDashboard, LogOut, MapPin, Menu, MessageSquareText, Moon, Settings, ShieldCheck, Sun, X } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { t_ } from '../lib/i18n'
import { usePendingCounts } from '../lib/queries'
import { useRealtime } from '../lib/realtime'
import type { PendingCounts } from '../lib/types'
import { useTheme, type Theme } from './ThemeProvider'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  count?: keyof PendingCounts
}

const nav: NavItem[] = [
  { to: '/', label: t_('nav.overview'), icon: LayoutDashboard },
  { to: '/spots', label: t_('nav.spots'), icon: MapPin, count: 'spots' },
  { to: '/reviews', label: t_('nav.reviews'), icon: MessageSquareText, count: 'ratings' },
  { to: '/photos', label: t_('nav.photos'), icon: Image, count: 'photos' },
  { to: '/reports', label: t_('nav.reports'), icon: Flag, count: 'reports' },
  { to: '/audit', label: t_('nav.audit'), icon: History },
  { to: '/admins', label: t_('nav.admins'), icon: ShieldCheck },
  { to: '/settings', label: t_('nav.settings'), icon: Settings },
]

export function Layout() {
  const { state, signOut } = useAuth()
  const { data: counts } = usePendingCounts()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  useRealtime()
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
        <ThemeToggle theme={theme} onChange={setTheme} />
        <p className="truncate px-3 text-xs text-zinc-500">Sesión: {username}</p>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LogOut className="size-4" />
          {t_('nav.signOut')}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white dark:focus:bg-white dark:focus:text-zinc-900"
      >
        Saltar al contenido principal
      </a>
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
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const options: { value: Theme; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: t_('theme.light'), icon: Sun },
    { value: 'system', label: t_('theme.system'), icon: Settings },
    { value: 'dark', label: t_('theme.dark'), icon: Moon },
  ]
  return (
    <div className="mb-3 flex items-center gap-1 px-2" role="radiogroup" aria-label={t_('theme.toggle')}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => onChange(value)}
          className={`flex flex-1 items-center justify-center rounded-md p-1.5 transition-colors ${
            theme === value
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
