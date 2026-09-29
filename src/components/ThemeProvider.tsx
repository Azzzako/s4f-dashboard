import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

const STORAGE_KEY = 's4f-theme'

function getSystemTheme(): Resolved {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: Resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

interface ThemeContextValue {
  theme: Theme
  resolved: Resolved
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStored())
  const [resolved, setResolved] = useState<Resolved>(() => (theme === 'system' ? getSystemTheme() : theme))

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      window.localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* storage may be disabled (private mode); fall back silently */
    }
  }, [])

  useEffect(() => {
    const next: Resolved = theme === 'system' ? getSystemTheme() : theme
    setResolved(next)
    applyTheme(next)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = mq.matches ? 'dark' : 'light'
      setResolved(next)
      applyTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}