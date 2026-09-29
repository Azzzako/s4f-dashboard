import { useQuery } from '@tanstack/react-query'
import { Shield, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Avatar, Button, Card, PageHeader, QueryState, StatusBadge } from '../components/ui'
import { SearchInput } from '../components/SearchInput'
import { TableRowSkeleton } from '../components/Skeleton'
import { fetchAdminUsers, setUserRole, type AdminUser } from '../lib/api'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'

const PAGE_SIZE = 50

export function AdminUsersPage() {
  const { state } = useAuth()
  const myId = state.status === 'admin' ? state.userId : ''
  const [search, setSearch] = useSearchParam<string>('q', '', [''])
  const [offset, setOffset] = useState(0)

  const query = useQuery({
    queryKey: ['admin-users', search, offset],
    queryFn: () => fetchAdminUsers({ search: search || undefined, offset, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const items = query.data ?? []
  const total = items[0]?.total ?? 0

  const promote = useModeration(
    ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => setUserRole(userId, role),
    'Rol actualizado.',
    { invalidate: ['admin-users', 'audit'] },
  )

  return (
    <>
      <PageHeader title="Administradores" subtitle="Promueve o quita el rol de admin a cualquier cuenta." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por email o usuario…" />
        </div>
        {total > 0 && (
          <span className="ml-auto text-sm text-zinc-500 tabular-nums">
            {items.length} de {total}
          </span>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={items.length === 0}
        emptyText={search ? 'Sin resultados.' : 'No hay usuarios.'}
        onRetry={query.refetch}
        skeleton={<TableRowSkeleton rows={6} cols={4} />}
      >
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 uppercase dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isMe={u.id === myId}
                  busy={promote.isPending && promote.variables?.userId === u.id}
                  onToggle={() => promote.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                />
              ))}
            </tbody>
          </table>
        </Card>

        {items.length === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
      </QueryState>
    </>
  )
}

function UserRow({
  user,
  isMe,
  busy,
  onToggle,
}: {
  user: AdminUser
  isMe: boolean
  busy: boolean
  onToggle: () => void
}) {
  const isAdmin = user.role === 'admin'
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={user.username} url={user.avatar_url} />
          <div className="min-w-0">
            <p className="truncate font-medium">@{user.username ?? '—'}</p>
            {isMe && <p className="text-xs text-zinc-500">(tú)</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-zinc-500">{user.email}</td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <StatusBadge status="approved" />
        ) : (
          <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
            Usuario
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant={isAdmin ? 'ghost' : 'approve'}
          icon={isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
          onClick={onToggle}
          loading={busy}
          disabled={isAdmin && isMe}
          title={isAdmin && isMe ? 'No puedes quitarte el rol a ti mismo' : undefined}
        >
          {isAdmin ? 'Quitar admin' : 'Hacer admin'}
        </Button>
      </td>
    </tr>
  )
}