import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { fetchRatings, setRatingStatus } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { ReviewStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { Avatar, Button, Card, Lightbox, PageHeader, QueryState, Stars, StatusBadge, Tabs, Thumb } from '../components/ui'

const statuses: ReviewStatus[] = ['pending', 'approved', 'rejected']

export function ReviewsPage() {
  const [status, setStatus] = useState<ReviewStatus>('pending')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['ratings', status], queryFn: () => fetchRatings(status) })

  const moderate = useModeration(
    ({ id, next }: { id: string; next: ReviewStatus }) => setRatingStatus(id, next),
    'Reseña actualizada.',
  )
  const busy = (id: string, next: ReviewStatus) =>
    moderate.isPending && moderate.variables?.id === id && moderate.variables.next === next

  return (
    <>
      <PageHeader title="Reseñas" subtitle="Solo las reseñas aprobadas cuentan para el promedio del spot.">
        <Tabs value={status} options={statuses} onChange={setStatus} />
      </PageHeader>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={query.data?.length === 0}
        emptyText="No hay reseñas en esta lista."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.map((r) => (
            <Card key={r.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar name={r.author?.username} url={r.author?.avatar_url} />
                  <div>
                    <p className="text-sm font-medium">@{r.author?.username ?? 'desconocido'}</p>
                    <p className="text-xs text-zinc-500">
                      en <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.spot?.name ?? '—'}</span> ·{' '}
                      {timeAgo(r.created_at)}
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

              <div className="mt-4 flex gap-2">
                {r.status !== 'approved' && (
                  <Button
                    variant="approve"
                    icon={<Check className="size-4" />}
                    loading={busy(r.id, 'approved')}
                    onClick={() => moderate.mutate({ id: r.id, next: 'approved' })}
                  >
                    Aprobar
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button
                    variant={r.status === 'pending' ? 'reject' : 'ghost'}
                    icon={<X className="size-4" />}
                    loading={busy(r.id, 'rejected')}
                    onClick={() => moderate.mutate({ id: r.id, next: 'rejected' })}
                  >
                    Rechazar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}
