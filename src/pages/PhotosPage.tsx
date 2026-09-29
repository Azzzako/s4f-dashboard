import { useQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fetchPhotos, setPhotoStatus, setPhotosStatusBulk } from '../lib/api'
import type { Photo, PhotoStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'
import { Button, Card, Lightbox, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs } from '../components/ui'
import { BulkBar } from '../components/BulkBar'
import { Checkbox } from '../components/Checkbox'
import { PhotoGridSkeleton } from '../components/Skeleton'

const statuses: PhotoStatus[] = ['pending', 'approved', 'rejected']
const PAGE_SIZE = 50

export function PhotosPage() {
  const [status, setStatus] = useSearchParam<PhotoStatus>('status', 'pending', statuses)
  const [offset, setOffset] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkRejecting, setBulkRejecting] = useState(false)

  const query = useQuery({
    queryKey: ['photos', status, offset],
    queryFn: () => fetchPhotos(status, { offset, limit: PAGE_SIZE, paginate: offset > 0 }),
    placeholderData: (prev) => prev,
  })

  const items = query.data ?? []
  const ids = useMemo(() => items.map((p) => p.id), [items])
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))

  const onStatus = (v: PhotoStatus) => {
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
    ({ id, next }: { id: string; next: PhotoStatus }) => setPhotoStatus(id, next),
    'Foto actualizada.',
    { invalidate: ['photos', 'pending-counts'] },
  )
  const bulkApprove = useModeration(
    (ids: string[]) => setPhotosStatusBulk(ids, 'approved'),
    'Fotos aprobadas.',
    { invalidate: ['photos', 'pending-counts'] },
  )
  const bulkReject = useModeration(
    ({ ids, reason }: { ids: string[]; reason: string }) => setPhotosStatusBulk(ids, 'rejected', reason),
    'Fotos rechazadas.',
    { invalidate: ['photos', 'pending-counts'] },
  )
  const busy = (id: string, next: PhotoStatus) =>
    moderate.isPending && moderate.variables?.id === id && moderate.variables.next === next

  const selectedCount = selected.size

  return (
    <>
      <PageHeader title="Fotos" subtitle="Fotos subidas por autores y en reseñas. Toca una para verla completa.">
        <Tabs value={status} options={statuses} onChange={onStatus} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {items.length > 0 && (
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
        emptyText="No hay fotos en esta lista."
        onRetry={query.refetch}
        skeleton={<PhotoGridSkeleton count={12} />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <PhotoCard
              key={p.id}
              p={p}
              checked={selected.has(p.id)}
              onToggle={() => toggleOne(p.id)}
              onOpen={setLightbox}
              busy={busy(p.id, 'approved') || busy(p.id, 'rejected')}
              onApprove={() => moderate.mutate({ id: p.id, next: 'approved' })}
              onReject={() => moderate.mutate({ id: p.id, next: 'rejected' })}
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

      <ReasonDialog
        open={bulkRejecting}
        title={`Rechazar ${selectedCount} fotos`}
        description="El motivo se guarda en el log de auditoría."
        confirmLabel={`Rechazar ${selectedCount}`}
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

function PhotoCard({
  p,
  checked,
  onToggle,
  onOpen,
  busy,
  onApprove,
  onReject,
}: {
  p: Photo
  checked: boolean
  onToggle: () => void
  onOpen: (url: string) => void
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(p.url)}
          className="block aspect-square w-full bg-zinc-100 dark:bg-zinc-800"
        >
          <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
        </button>
        <div className="absolute top-2 left-2">
          <Checkbox checked={checked} onChange={onToggle} label={`Seleccionar foto`} />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{p.spot?.name ?? '—'}</p>
          <StatusBadge status={p.photo_status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          @{p.uploader?.username ?? '—'} · {p.review_id ? 'reseña' : 'autor'}
        </p>
        <div className="mt-3 flex gap-2">
          {p.photo_status !== 'approved' && (
            <Button
              variant="approve"
              className="flex-1"
              icon={<Check className="size-4" />}
              loading={busy && p.photo_status === 'pending'}
              onClick={onApprove}
              aria-label="Aprobar foto"
            />
          )}
          {p.photo_status !== 'rejected' && (
            <Button
              variant="reject"
              className="flex-1"
              icon={<X className="size-4" />}
              loading={busy && p.photo_status !== 'pending'}
              onClick={onReject}
              aria-label="Rechazar foto"
            />
          )}
        </div>
      </div>
    </Card>
  )
}