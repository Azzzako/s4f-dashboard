import type { AuditEntry } from './types'

const DAY = 86_400_000

export interface DailyAction {
  date: string // YYYY-MM-DD
  approved: number
  rejected: number
  other: number
  total: number
}

export interface MixBucket {
  label: string
  value: number
}

// Buckets per day for the last `days` days, inclusive of today.
export function dailyActions(entries: AuditEntry[], days = 30): DailyAction[] {
  const now = new Date()
  const start = new Date(now.getTime() - (days - 1) * DAY)
  start.setHours(0, 0, 0, 0)

  const buckets = new Map<string, DailyAction>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY)
    const key = toDateKey(d)
    buckets.set(key, { date: key, approved: 0, rejected: 0, other: 0, total: 0 })
  }

  for (const e of entries) {
    const t = new Date(e.created_at).getTime()
    if (t < start.getTime()) continue
    const key = toDateKey(new Date(t))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.total++
    if (e.action.endsWith('.approved')) bucket.approved++
    else if (e.action.endsWith('.rejected')) bucket.rejected++
    else bucket.other++
  }

  return Array.from(buckets.values())
}

export function actionMix(entries: AuditEntry[]): MixBucket[] {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    const head = e.action.split('.')[0] // spot, rating, photo, report, user
    counts[head] = (counts[head] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export interface ModeratorRow {
  username: string
  total: number
  approved: number
  rejected: number
}

export function topModerators(entries: AuditEntry[], limit = 5): ModeratorRow[] {
  const map = new Map<string, ModeratorRow>()
  for (const e of entries) {
    const name = e.admin?.username ?? 'desconocido'
    let row = map.get(name)
    if (!row) {
      row = { username: name, total: 0, approved: 0, rejected: 0 }
      map.set(name, row)
    }
    row.total++
    if (e.action.endsWith('.approved')) row.approved++
    if (e.action.endsWith('.rejected')) row.rejected++
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, limit)
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}