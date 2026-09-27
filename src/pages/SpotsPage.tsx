import { useQuery } from '@tanstack/react-query'
import { Check, ExternalLink, MapPin, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { deleteSpot, fetchSpots, setSpotStatus } from '../lib/api'
import { label, timeAgo } from '../lib/format'
import type { Spot, SpotStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { Avatar, Button, Card, Chip, Lightbox, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs, Thumb } from '../components/ui'

const statuses: SpotStatus[] = ['pending', 'approved', 'rejected']

export function SpotsPage() {
  const [status, setStatus] = useState<SpotStatus>('pending')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Spot | null>(null)
  const [deleting, setDeleting] = useState<Spot | null>(null)

  const query = useQuery({ queryKey: ['spots', status], queryFn: () => fetchSpots(status) })

  const approve = useModeration((id: string) => setSpotStatus(id, 'approved'), 'Spot aprobado. Ya aparece en el mapa.')
  const reject = useModeration(
    ({ id, reason }: { id: string; reason: string }) => setSpotStatus(id, 'rejected', reason),
    'Spot rechazado.',
  )
  const remove = useModeration(
    ({ id, reason }: { id: string; reason: string }) => deleteSpot(id, reason),
    'Spot eliminado.',
  )

  return (
    <>
      <PageHeader title="Spots" subtitle="Aprueba los spots nuevos para que aparezcan en el mapa de la app.">
        <Tabs value={status} options={statuses} onChange={setStatus} />
      </PageHeader>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={query.data?.length === 0}
        emptyText="No hay spots en esta lista."
      >
        <div className="grid gap-4">
          {query.data?.map((spot) => (
            <Card key={spot.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{spot.name}</h2>
                    <StatusBadge status={spot.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Avatar name={spot.author?.username} url={spot.author?.avatar_url} />
                    <span>@{spot.author?.username ?? 'desconocido'}</span>
                    <span>·</span>
                    <span>{timeAgo(spot.created_at)}</span>
                  </div>
                </div>
                <SpotActions
                  spot={spot}
                  approving={approve.isPending && approve.variables === spot.id}
                  onApprove={() => approve.mutate(spot.id)}
                  onReject={() => setRejecting(spot)}
                  onDelete={() => setDeleting(spot)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Chip>{label(spot.type)}</Chip>
                <Chip>{label(spot.difficulty)}</Chip>
                {spot.best_time.map((t) => (
                  <Chip key={t}>{label(t)}</Chip>
                ))}
              </div>

              {spot.description && <p className="mt-3 text-sm whitespace-pre-line">{spot.description}</p>}
              {spot.safety_notes && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <span className="font-medium">Seguridad:</span> {spot.safety_notes}
                </p>
              )}
              {spot.reject_reason && spot.status === 'rejected' && (
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                  <span className="font-medium">Motivo de rechazo:</span> {spot.reject_reason}
                </p>
              )}

              <a
                href={`https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lng}#map=18/${spot.lat}/${spot.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              >
                <MapPin className="size-4" />
                {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
                <ExternalLink className="size-3" />
              </a>

              {spot.spot_photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...spot.spot_photos]
                    .sort((a, b) => a.position - b.position)
                    .map((p) => (
                      <Thumb key={p.id} url={p.url} onOpen={setLightbox} />
                    ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </QueryState>

      <ReasonDialog
        open={rejecting !== null}
        title={`Rechazar "${rejecting?.name ?? ''}"`}
        description="El autor recibirá una notificación con este motivo y podrá corregir el spot."
        confirmLabel="Rechazar"
        loading={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) =>
          rejecting && reject.mutate({ id: rejecting.id, reason }, { onSuccess: () => setRejecting(null) })
        }
      />
      <ReasonDialog
        open={deleting !== null}
        title={`Eliminar "${deleting?.name ?? ''}"`}
        description="Se borra el spot con sus fotos, reseñas y likes. No se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        required={false}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={(reason) =>
          deleting && remove.mutate({ id: deleting.id, reason }, { onSuccess: () => setDeleting(null) })
        }
      />
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}

function SpotActions({
  spot,
  approving,
  onApprove,
  onReject,
  onDelete,
}: {
  spot: Spot
  approving: boolean
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {spot.status !== 'approved' && (
        <Button variant="approve" icon={<Check className="size-4" />} loading={approving} onClick={onApprove}>
          Aprobar
        </Button>
      )}
      {spot.status !== 'rejected' && (
        <Button variant={spot.status === 'pending' ? 'reject' : 'ghost'} icon={<X className="size-4" />} onClick={onReject}>
          {spot.status === 'approved' ? 'Despublicar' : 'Rechazar'}
        </Button>
      )}
      <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={onDelete} aria-label="Eliminar spot" />
    </div>
  )
}
