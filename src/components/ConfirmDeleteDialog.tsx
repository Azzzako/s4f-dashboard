import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Button, Modal } from './ui'

interface Props {
  open: boolean
  spotName?: string
  loading?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

// Password re-entry + optional reason for the most destructive action:
// deleting a spot. The password check actually re-authenticates with
// Supabase (signInWithPassword), so a wrong password blocks the delete.
export function ConfirmDeleteDialog({ open, spotName, loading, onConfirm, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setReason('')
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setChecking(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session?.user.email) throw new Error('No hay sesión activa.')
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.session.user.email,
        password,
      })
      if (signInErr) throw new Error('Contraseña incorrecta.')
      onConfirm(reason.trim())
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={submit}
        className="w-[min(92vw,28rem)] rounded-xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <h2 className="text-lg font-semibold">Eliminar {spotName ? `"${spotName}"` : 'spot'}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Confirma con tu contraseña. Esta acción borra fotos, reseñas y likes del spot. No se puede deshacer.
        </p>
        <label className="mt-4 block text-sm font-medium">
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
          />
        </label>
        <label className="mt-3 block text-sm font-medium">
          Motivo (opcional)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Por qué se elimina. Queda en el log de auditoría."
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="reject" disabled={!password || checking} loading={checking || loading}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : null}
            Eliminar definitivamente
          </Button>
        </div>
      </form>
    </Modal>
  )
}