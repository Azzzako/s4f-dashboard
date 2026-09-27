import { useQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { fetchPhotos, setPhotoStatus } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { PhotoStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { Button, Card, Lightbox, PageHeader, QueryState, StatusBadge, Tabs } from '../components/ui'

const statuses: PhotoStatus[] = ['pending', 'approved', 'rejected']

export function PhotosPage() {
  const [status, setStatus] = useState<PhotoStatus>('pending')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['photos', status], queryFn: () => fetchPhotos(status) })

  const moderate = useModeration(
    ({ id, next }: { id: string; next: PhotoStatus }) => setPhotoStatus(id, next),
    'Foto actualizada.',
  )
  const busy = (id: string, next: PhotoStatus) =>
    moderate.isPending && moderate.variables?.id === id && moderate.variables.next === next

  return (
    <>
      <PageHeader title="Fotos" subtitle="Fotos subidas por autores y en reseñas. Toca una para verla completa.">
        <Tabs value={status} options={statuses} onChange={setStatus} />
      </PageHeader>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={query.data?.length === 0}
        emptyText="No hay fotos en esta lista."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {query.data?.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <button type="button" onClick={() => setLightbox(p.url)} className="block aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
                <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
              </button>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{p.spot?.name ?? '—'}</p>
                  <StatusBadge status={p.photo_status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  @{p.uploader?.username ?? '—'} · {p.review_id ? 'reseña' : 'autor'} · {timeAgo(p.created_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  {p.photo_status !== 'approved' && (
                    <Button
                      variant="approve"
                      className="flex-1"
                      icon={<Check className="size-4" />}
                      loading={busy(p.id, 'approved')}
                      onClick={() => moderate.mutate({ id: p.id, next: 'approved' })}
                      aria-label="Aprobar foto"
                    />
                  )}
                  {p.photo_status !== 'rejected' && (
                    <Button
                      variant="reject"
                      className="flex-1"
                      icon={<X className="size-4" />}
                      loading={busy(p.id, 'rejected')}
                      onClick={() => moderate.mutate({ id: p.id, next: 'rejected' })}
                      aria-label="Rechazar foto"
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}
