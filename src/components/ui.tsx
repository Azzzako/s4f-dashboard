import { AlertTriangle, Inbox, Loader2, Star, X } from 'lucide-react'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { label } from '../lib/format'

// ----- Button -----

const variants = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
  approve: 'bg-emerald-600 text-white hover:bg-emerald-700',
  reject: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost:
    'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  loading?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', loading, icon, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ----- Badge -----

const badgeTones: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  reviewed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  dismissed: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeTones[status] ?? badgeTones.dismissed}`}>
      {label(status)}
    </span>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  )
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
      ))}
    </span>
  )
}

// ----- Page scaffolding -----

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
      {options.map((opt) => (
        <button
          key={opt}
          role="tab"
          aria-selected={opt === value}
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            opt === value
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {children}
    </div>
  )
}

export function Avatar({ name, url }: { name?: string | null; url?: string | null }) {
  if (url) return <img src={url} alt="" className="size-7 rounded-full object-cover" />
  return (
    <span className="grid size-7 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 uppercase">
      {(name ?? '?').slice(0, 1)}
    </span>
  )
}

// ----- Query states -----

export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyText,
  children,
}: {
  isLoading: boolean
  error: Error | null
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-zinc-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }
  if (error) {
    return (
      <Card className="flex items-start gap-3 p-4 text-sm text-rose-700 dark:text-rose-300">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">No se pudo cargar.</p>
          <p className="mt-0.5 text-rose-600/80 dark:text-rose-300/80">{error.message}</p>
        </div>
      </Card>
    )
  }
  if (isEmpty) {
    return (
      <div className="grid place-items-center gap-2 py-20 text-center text-zinc-400">
        <Inbox className="size-8" />
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }
  return <>{children}</>
}

// ----- Modal primitives -----

function Modal({ open, onClose, children, className = '' }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto rounded-xl bg-transparent p-0 backdrop:bg-black/60 ${className}`}
    >
      {open && children}
    </dialog>
  )
}

export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  required = true,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  required?: boolean
  loading?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const valid = !required || reason.trim().length >= 3
  return (
    <Modal open={open} onClose={onClose}>
      <form
        className="w-[min(92vw,28rem)] rounded-xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onConfirm(reason.trim())
        }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={required ? 'Motivo (lo verá el usuario)' : 'Nota opcional'}
          className="mt-4 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="reject" disabled={!valid} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal open={url !== null} onClose={onClose}>
      <div className="relative">
        <img src={url ?? ''} alt="" className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain" />
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="size-4" />
        </button>
      </div>
    </Modal>
  )
}

export function Thumb({ url, onOpen, size = 'md' }: { url: string; onOpen: (url: string) => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className={`overflow-hidden rounded-lg bg-zinc-100 ring-brand-500 hover:ring-2 dark:bg-zinc-800 ${size === 'sm' ? 'size-16' : 'size-24'}`}
    >
      <img src={url} alt="" loading="lazy" className="size-full object-cover" />
    </button>
  )
}
