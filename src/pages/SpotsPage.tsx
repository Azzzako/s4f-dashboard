import { useQuery } from '@tanstack/react-query'
import { Check, ExternalLink, MapPin, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { deleteSpot, fetchSpots, setSpotsStatusBulk, setSpotStatus } from '../lib/api'
import { label } from '../lib/format'
import type { Spot, SpotStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'
import { Button, Card, Chip, Lightbox, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs, Thumb } from '../components/ui'
import { BulkBar } from '../components/BulkBar'
import { Checkbox } from '../components/Checkbox'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { SearchInput } from '../components/SearchInput'
import { GridCardSkeleton } from '../components/Skeleton'
import { UserLine } from '../components/UserLine'

const statuses: SpotStatus[] = ['pending', 'approved', 'rejected']
const PAGE_SIZE = 25

const SPOT_TYPES = ['street', 'park', 'bowl', 'plaza', 'diy', 'skateshop', 'skatepark', 'gap']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export function SpotsPage() {
  const [status, setStatus] = useSearchParam<SpotStatus>('status', 'pending', statuses)
  const [search, setSearch] = useSearchParam<string>('q', '', [''])
  const [spotType, setSpotType] = useSearchParam<string>('type', '', [''])
  const [difficulty, setDifficulty] = useSearchParam<string>('difficulty', '', [''])
  const [dateFrom, setDateFrom] = useSearchParam<string>('from', '', [''])
  const [dateTo, setDateTo] = useSearchParam<string>('to', '', [''])
  const [offset, setOffset] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Spot | null>(null)
  const [deleting, setDeleting] = useState<Spot | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkRejecting, setBulkRejecting] = useState(false)

  const query = useQuery({
    queryKey: ['spots', status, search, spotType, difficulty, dateFrom, dateTo, offset],
    queryFn: () =>
      fetchSpots(status, {
        search: search || undefined,
        spotType: spotType || undefined,
        difficulty: difficulty || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        offset,
        limit: PAGE_SIZE,
        paginate: offset > 0,
      }),
    placeholderData: (prev) => prev,
  })

  const items = query.data ?? []
  const ids = useMemo(() => items.map((s) => s.id), [items])
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))
  const someChecked = ids.some((id) => selected.has(id))

  const onSearch = (v: string) => {
    setSearch(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onTypeFilter = (v: string) => {
    setSpotType(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onDifficultyFilter = (v: string) => {
    setDifficulty(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onDateRange = (range: { from: string; to: string }) => {
    setDateFrom(range.from)
    setDateTo(range.to)
    setOffset(0)
    setSelected(new Set())
  }
  const onStatus = (v: SpotStatus) => {
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

  const approve = useModeration((id: string) => setSpotStatus(id, 'approved'), 'Spot aprobado.', { invalidate: ['spots', 'pending-counts'] })
  const reject = useModeration(
    ({ id, reason }: { id: string; reason: string }) => setSpotStatus(id, 'rejected', reason),
    'Spot rechazado.',
    { invalidate: ['spots', 'pending-counts'] },
  )
  const remove = useModeration(
    ({ id, reason }: { id: string; reason: string }) => deleteSpot(id, reason),
    'Spot eliminado.',
    { invalidate: ['spots', 'pending-counts'] },
  )
  const bulkApprove = useModeration(
    (ids: string[]) => setSpotsStatusBulk(ids, 'approved'),
    'Spots aprobados.',
    { invalidate: ['spots', 'pending-counts'] },
  )
  const bulkRejectMod = useModeration(
    ({ ids, reason }: { ids: string[]; reason: string }) => setSpotsStatusBulk(ids, 'rejected', reason),
    'Spots rechazados.',
    { invalidate: ['spots', 'pending-counts'] },
  )

  const selectedCount = selected.size

  return (
    <>
      <PageHeader title="Spots" subtitle="Aprueba los spots nuevos para que aparezcan en el mapa de la app.">
        <Tabs value={status} options={statuses} onChange={onStatus} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <SearchInput value={search} onChange={onSearch} placeholder="Buscar por nombre o descripción…" />
        </div>
        <select
          value={spotType}
          onChange={(e) => onTypeFilter(e.target.value)}
          aria-label="Tipo de spot"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todos los tipos</option>
          {SPOT_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyFilter(e.target.value)}
          aria-label="Dificultad"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas las dificultades</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {label(d)}
            </option>
          ))}
        </select>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={onDateRange} />
        {items.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Checkbox checked={allChecked} onChange={toggleAll} label="Seleccionar todo" />
            {someChecked ? `${selectedCount}/${items.length}` : 'Seleccionar todo'}
          </button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={items.length === 0}
        emptyText={search || spotType || difficulty ? 'Sin resultados para los filtros aplicados.' : 'No hay spots en esta lista.'}
        onRetry={query.refetch}
        skeleton={<GridCardSkeleton count={6} />}
      >
        <div className="grid gap-4">
          {items.map((spot) => (
            <Card key={spot.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    checked={selected.has(spot.id)}
                    onChange={() => toggleOne(spot.id)}
                    label={`Seleccionar ${spot.name}`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{spot.name}</h2>
                      <StatusBadge status={spot.status} />
                    </div>
                    <UserLine
                      name={spot.author?.username}
                      avatarUrl={spot.author?.avatar_url}
                      date={spot.created_at}
                      className="mt-1"
                    />
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

        {items.length === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
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
      <ConfirmDeleteDialog
        open={deleting !== null}
        spotName={deleting?.name}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={(reason) =>
          deleting && remove.mutate({ id: deleting.id, reason }, { onSuccess: () => setDeleting(null) })
        }
      />
      <ReasonDialog
        open={bulkRejecting}
        title={`Rechazar ${selectedCount} spots`}
        description="El motivo se guarda en el log de auditoría y se notifica a cada autor."
        confirmLabel={`Rechazar ${selectedCount}`}
        loading={bulkRejectMod.isPending}
        onClose={() => setBulkRejecting(false)}
        onConfirm={(reason) =>
          bulkRejectMod.mutate(
            { ids: Array.from(selected), reason },
            { onSuccess: () => { setBulkRejecting(false); clearSelection() } },
          )
        }
      />
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />

      <BulkBar
        count={selectedCount}
        busy={bulkApprove.isPending || bulkRejectMod.isPending}
        onClear={clearSelection}
      >
        <Button
          variant="approve"
          icon={<Check className="size-4" />}
          loading={bulkApprove.isPending}
          onClick={() =>
            bulkApprove.mutate(Array.from(selected), { onSuccess: clearSelection })
          }
        >
          Aprobar
        </Button>
        <Button
          variant="reject"
          icon={<X className="size-4" />}
          loading={bulkRejectMod.isPending}
          onClick={() => setBulkRejecting(true)}
        >
          Rechazar
        </Button>
      </BulkBar>
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