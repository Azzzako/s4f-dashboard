import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fetchRatings, setRatingsStatusBulk, setRatingStatus } from '../lib/api'
import type { Rating, ReviewStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'
import { Avatar, Button, Card, Lightbox, PageHeader, QueryState, ReasonDialog, Stars, StatusBadge, Tabs, Thumb } from '../components/ui'
import { BulkBar } from '../components/BulkBar'
import { Checkbox } from '../components/Checkbox'
import { SearchInput } from '../components/SearchInput'
import { GridCardSkeleton } from '../components/Skeleton'

const statuses: ReviewStatus[] = ['pending', 'approved', 'rejected']
const PAGE_SIZE = 25

export function ReviewsPage() {
  const [status, setStatus] = useSearchParam<ReviewStatus>('status', 'pending', statuses)
  const [search, setSearch] = useSearchParam<string>('q', '', [''])
  const [offset, setOffset] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkRejecting, setBulkRejecting] = useState(false)

  const query = useQuery({
    queryKey: ['ratings', status, search, offset],
    queryFn: () => fetchRatings(status, { search: search || undefined, offset, limit: PAGE_SIZE, paginate: offset > 0 }),
    placeholderData: (prev) => prev,
  })

  const items = query.data ?? []
  const ids = useMemo(() => items.map((r) => r.id), [items])
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))

  const onSearch = (v: string) => {
    setSearch(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onStatus = (v: ReviewStatus) => {
    setStatus(v)
    setOffset(0)
    setSelected(new Set())
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())

  const moderate = useModeration(
    ({ id, next }: { id: string; next: ReviewStatus }) => setRatingStatus(id, next),
    'Reseña actualizada.',
    { invalidate: ['ratings', 'pending-counts'] },
  )
  const bulkApprove = useModeration(
    (ids: string[]) => setRatingsStatusBulk(ids, 'approved'),
    'Reseñas aprobadas.',
    { invalidate: ['ratings', 'pending-counts'] },
  )
  const bulkReject = useModeration(
    ({ ids, reason }: { ids: string[]; reason: string }) => setRatingsStatusBulk(ids, 'rejected', reason),
    'Reseñas rechazadas.',
    { invalidate: ['ratings', 'pending-counts'] },
  )
  const busy = (id: string, next: ReviewStatus) =>
    moderate.isPending && moderate.variables?.id === id && moderate.variables.next === next

  const selectedCount = selected.size

  return (
    <>
      <PageHeader title="Reseñas" subtitle="Solo las reseñas aprobadas cuentan para el promedio del spot.">
        <Tabs value={status} options={statuses} onChange={onStatus} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <SearchInput value={search} onChange={onSearch} placeholder="Buscar en comentarios…" />
        </div>
        {items.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Checkbox checked={allChecked} onChange={toggleAll} label="Seleccionar todo" />
            {selectedCount > 0 ? `${selectedCount}/${items.length}` : 'Seleccionar todo'}
          </button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={items.length === 0}
        emptyText={search ? 'Sin resultados para la búsqueda.' : 'No hay reseñas en esta lista.'}
        onRetry={query.refetch}
        skeleton={<GridCardSkeleton count={6} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <ReviewCard
              key={r.id}
              r={r}
              checked={selected.has(r.id)}
              onToggle={() => toggleOne(r.id)}
              busy={busy(r.id, 'approved') || busy(r.id, 'rejected')}
              onApprove={() => moderate.mutate({ id: r.id, next: 'approved' })}
              onReject={() => moderate.mutate({ id: r.id, next: 'rejected' })}
            />
          ))}
        </div>

        {items.length === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
      </QueryState>
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />

      <ReasonBulk
        open={bulkRejecting}
        count={selectedCount}
        loading={bulkReject.isPending}
        onClose={() => setBulkRejecting(false)}
        onConfirm={(reason) =>
          bulkReject.mutate(
            { ids: Array.from(selected), reason },
            { onSuccess: () => { setBulkRejecting(false); clearSelection() } },
          )
        }
      />
      <BulkBar count={selectedCount} busy={bulkApprove.isPending || bulkReject.isPending} onClear={clearSelection}>
        <Button
          variant="approve"
          icon={<Check className="size-4" />}
          loading={bulkApprove.isPending}
          onClick={() => bulkApprove.mutate(Array.from(selected), { onSuccess: clearSelection })}
        >
          Aprobar
        </Button>
        <Button
          variant="reject"
          icon={<X className="size-4" />}
          loading={bulkReject.isPending}
          onClick={() => setBulkRejecting(true)}
        >
          Rechazar
        </Button>
      </BulkBar>
    </>
  )
}

function ReviewCard({
  r,
  checked,
  onToggle,
  busy,
  onApprove,
  onReject,
}: {
  r: Rating
  checked: boolean
  onToggle: () => void
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox checked={checked} onChange={onToggle} label={`Seleccionar reseña de ${r.author?.username ?? 'usuario'}`} />
          <Avatar name={r.author?.username} url={r.author?.avatar_url} />
          <div>
            <p className="text-sm font-medium">@{r.author?.username ?? 'desconocido'}</p>
            <p className="text-xs text-zinc-500">
              en <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.spot?.name ?? '—'}</span> ·{' '}
              {new Date(r.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Stars value={r.rating} />
        {r.edited && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Pencil className="size-3" /> editada
          </span>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm whitespace-pre-line">{r.comment}</p>

      {r.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.photos.map((p) => (
            <div key={p.id} className="relative">
              <Thumb url={p.url} size="sm" onOpen={setLightbox} />
              {p.photo_status !== 'approved' && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                  foto {p.photo_status === 'pending' ? 'pendiente' : 'rechazada'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />

      <div className="mt-4 flex gap-2">
        {r.status !== 'approved' && (
          <Button variant="approve" icon={<Check className="size-4" />} loading={busy && r.status === 'pending'} onClick={onApprove}>
            Aprobar
          </Button>
        )}
        {r.status !== 'rejected' && (
          <Button
            variant={r.status === 'pending' ? 'reject' : 'ghost'}
            icon={<X className="size-4" />}
            loading={busy && r.status !== 'pending'}
            onClick={onReject}
          >
            Rechazar
          </Button>
        )}
      </div>
    </Card>
  )
}

function ReasonBulk({
  open,
  count,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean
  count: number
  loading?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  return (
    <ReasonDialog
      open={open}
      title={`Rechazar ${count} reseñas`}
      description="El motivo se guarda en el log de auditoría."
      confirmLabel={`Rechazar ${count}`}
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}