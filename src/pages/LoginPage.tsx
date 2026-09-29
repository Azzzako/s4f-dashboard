import { ArrowRight, Loader2 } from 'lucide-react'
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (e) throw e
        toast.success('Te enviamos un correo para restablecer la contraseña.')
        setMode('login')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left: statement panel (always dark for visual punch) */}
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-zinc-100 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(#f97316 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div aria-hidden className="absolute top-0 left-0 h-1 w-32 bg-brand-500" />

        <div className="relative flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-brand-500 text-base font-black tracking-tight text-white">
            S4F
          </div>
          <div className="text-[10px] font-bold leading-tight uppercase tracking-[0.18em] text-zinc-500">
            Mod<br />Panel
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
            <span className="size-1.5 rounded-full bg-brand-500" />
            Admin · v1
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight xl:text-6xl">
            Para los que<br />
            cuidan el<br />
            <span className="text-brand-500">barrio.</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Aprueba spots, reseñas y fotos. Cada decisión llega al instante a la calle.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-6 border-t border-zinc-800 pt-6">
          <Stat value="24/7" label="En línea" />
          <Stat value="RT" label="Tiempo real" />
          <Stat value="0" label="Spam" />
        </div>
      </aside>

      {/* Right: form */}
      <main className="relative flex items-center justify-center bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="grid size-9 place-items-center rounded-lg bg-brand-500 text-sm font-black text-white">
            S4F
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Mod Panel</span>
        </div>

        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
              {mode === 'login' ? 'Acceso' : 'Recuperar'}
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
              {mode === 'login' ? 'Inicia sesión.' : 'Restaura tu pass.'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {mode === 'login'
                ? 'Solo admins. Si no tienes acceso, pide a uno que te agregue desde el panel.'
                : 'Te mandamos un link al correo para que pongas una contraseña nueva.'}
            </p>
          </div>

          <div className="space-y-6">
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-3 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100"
              />
            </Field>

            {mode === 'login' && (
              <Field label="Password">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-3 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100"
                />
              </Field>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-500 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === 'login' ? 'Entrar' : 'Enviar link'}
            {mode === 'login' && !loading && (
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null)
              setMode(mode === 'login' ? 'reset' : 'login')
            }}
            className="mt-5 block w-full text-center text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {mode === 'login' ? '¿Olvidaste tu contraseña?' : 'Volver a iniciar sesión'}
          </button>

          <p className="mt-14 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Spot For Fun · Mod Panel · 2024+
          </p>
        </form>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black tabular-nums text-white xl:text-3xl">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
    </div>
  )
}