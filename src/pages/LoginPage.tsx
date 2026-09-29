import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'reset'

export function LoginPage() {
  const { signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="grid min-h-full place-items-center px-4">
      <form
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setLoading(true)
          try {
            if (mode === 'login') {
              await signIn(email.trim(), password)
            } else {
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin,
              })
              if (error) throw error
              toast.success('Te enviamos un correo para restablecer la contraseña.')
              setMode('login')
            }
          } catch (err) {
            setError((err as Error).message)
          } finally {
            setLoading(false)
          }
        }}
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">S4F</span>
          <div>
            <h1 className="font-semibold">Spot For Fun</h1>
            <p className="text-xs text-zinc-500">Panel de administración</p>
          </div>
        </div>
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
          />
        </label>
        {mode === 'login' && (
          <label className="mt-4 block text-sm font-medium">
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
            />
          </label>
        )}
        {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'login' ? 'Entrar' : 'Enviar enlace de recuperación'}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode(mode === 'login' ? 'reset' : 'login')
          }}
          className="mt-3 block w-full text-center text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {mode === 'login' ? '¿Olvidaste tu contraseña?' : 'Volver a iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
