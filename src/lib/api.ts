import { supabase } from './supabase'
import type {
  AuditEntry,
  PendingCounts,
  Photo,
  PhotoStatus,
  Rating,
  Report,
  ReportStatus,
  ReviewStatus,
  Spot,
  SpotStatus,
} from './types'

const profileRef = 'id, username, avatar_url'
const photoRef = 'id, url, photo_status, position'
const spotRef = 'id, name, status'

// Embedded selects built from template strings defeat supabase-js type
// inference, so rows are typed by the caller.
function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// ----- reads (RLS lets admins see every row) -----

export interface ListParams {
  search?: string
  offset?: number
  limit?: number
  spotType?: string
  difficulty?: string
  dateFrom?: string // ISO date (YYYY-MM-DD)
  dateTo?: string
  /** When true, .range() is used for pagination. When false, a hard limit is applied. */
  paginate?: boolean
}

function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => '\\' + m)
}

type AnyQuery = {
  or: (filter: string) => AnyQuery
}

function searchFilter<Q extends AnyQuery>(query: Q, search: string | undefined, columns: string[]): Q {
  if (!search || !search.trim()) return query
  const q = `%${escapeIlike(search.trim())}%`
  const parts = columns.map((c) => `${c}.ilike.${q}`).join(',')
  return query.or(parts) as Q
}

export async function fetchSpots(status: SpotStatus, params: ListParams = {}): Promise<Spot[]> {
  const limit = params.limit ?? 25
  const offset = params.offset ?? 0
  let query = supabase
    .from('spots')
    .select(`*, author:profiles!spots_author_id_fkey(${profileRef}), spot_photos(${photoRef})`)
    .eq('status', status)
  query = searchFilter(query, params.search, ['name', 'description'])
  if (params.spotType) query = query.eq('type', params.spotType)
  if (params.difficulty) query = query.eq('difficulty', params.difficulty)
  if (params.dateFrom) query = query.gte('created_at', params.dateFrom)
  if (params.dateTo) query = query.lte('created_at', params.dateTo + 'T23:59:59')
  query = query.order('created_at', { ascending: status === 'pending' })
  if (params.paginate) query = query.range(offset, offset + limit - 1)
  else query = query.limit(limit)
  const res = await query
  return unwrap<Spot[]>(res)
}

export async function fetchRatings(status: ReviewStatus, params: ListParams = {}): Promise<Rating[]> {
  const limit = params.limit ?? 25
  const offset = params.offset ?? 0
  let query = supabase
    .from('spot_ratings')
    .select(
      `*, author:profiles!spot_ratings_user_id_fkey(${profileRef}),` +
        ` spot:spots!spot_ratings_spot_id_fkey(${spotRef}),` +
        ` photos:spot_photos!spot_photos_review_id_fkey(${photoRef})`,
    )
    .eq('status', status)
  query = searchFilter(query, params.search, ['comment'])
  if (params.dateFrom) query = query.gte('created_at', params.dateFrom)
  if (params.dateTo) query = query.lte('created_at', params.dateTo + 'T23:59:59')
  query = query.order('created_at', { ascending: status === 'pending' })
  if (params.paginate) query = query.range(offset, offset + limit - 1)
  else query = query.limit(limit)
  const res = await query
  return unwrap<Rating[]>(res)
}

export async function fetchPhotos(status: PhotoStatus, params: ListParams = {}): Promise<Photo[]> {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  let query = supabase
    .from('spot_photos')
    .select(
      `*, uploader:profiles!spot_photos_user_id_fkey(${profileRef}),` +
        ` spot:spots!spot_photos_spot_id_fkey(${spotRef})`,
    )
    .eq('photo_status', status)
  if (params.dateFrom) query = query.gte('created_at', params.dateFrom)
  if (params.dateTo) query = query.lte('created_at', params.dateTo + 'T23:59:59')
  query = query.order('created_at', { ascending: status === 'pending' })
  if (params.paginate) query = query.range(offset, offset + limit - 1)
  else query = query.limit(limit)
  const res = await query
  return unwrap<Photo[]>(res)
}

export async function fetchReports(status: ReportStatus, params: ListParams = {}): Promise<Report[]> {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  let query = supabase
    .from('spot_reports')
    .select(
      `*, reporter:profiles!spot_reports_reporter_id_fkey(${profileRef}),` +
        ` spot:spots!spot_reports_spot_id_fkey(${spotRef})`,
    )
    .eq('status', status)
  query = searchFilter(query, params.search, ['reason'])
  if (params.dateFrom) query = query.gte('created_at', params.dateFrom)
  if (params.dateTo) query = query.lte('created_at', params.dateTo + 'T23:59:59')
  query = query.order('created_at', { ascending: status === 'open' })
  if (params.paginate) query = query.range(offset, offset + limit - 1)
  else query = query.limit(limit)
  const res = await query
  return unwrap<Report[]>(res)
}

export async function fetchAudit(params: ListParams = {}): Promise<AuditEntry[]> {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  let query = supabase
    .from('admin_audit_log')
    .select('*, admin:profiles!admin_audit_log_admin_id_fkey(username)')
    .order('created_at', { ascending: false })
  if (params.paginate) query = query.range(offset, offset + limit - 1)
  else query = query.limit(limit)
  const res = await query
  return unwrap<AuditEntry[]>(res)
}

// Wider window for the analytics dashboard. Caps at 1000 to keep the
// client-side aggregation cheap.
export async function fetchAuditRecent(limit = 1000): Promise<AuditEntry[]> {
  const res = await supabase
    .from('admin_audit_log')
    .select('*, admin:profiles!admin_audit_log_admin_id_fkey(username)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return unwrap<AuditEntry[]>(res)
}

async function countWhere(table: string, column: string, value: string): Promise<number> {
  const res = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
  if (res.error) throw new Error(res.error.message)
  return res.count ?? 0
}

export async function fetchPendingCounts(): Promise<PendingCounts> {
  const [spots, ratings, photos, reports] = await Promise.all([
    countWhere('spots', 'status', 'pending'),
    countWhere('spot_ratings', 'status', 'pending'),
    countWhere('spot_photos', 'photo_status', 'pending'),
    countWhere('spot_reports', 'status', 'open'),
  ])
  return { spots, ratings, photos, reports }
}

// ----- writes (security definer RPCs, migration 0019) -----

async function rpc(fn: string, args: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
}

export const setSpotStatus = (id: string, status: SpotStatus, reason?: string) =>
  rpc('admin_set_spot_status', { p_spot_id: id, p_status: status, p_reason: reason ?? null })

export const setRatingStatus = (id: string, status: ReviewStatus) =>
  rpc('admin_set_rating_status', { p_rating_id: id, p_status: status })

export const setPhotoStatus = (id: string, status: PhotoStatus) =>
  rpc('admin_set_photo_status', { p_photo_id: id, p_status: status })

export const setReportStatus = (id: string, status: ReportStatus, reason?: string) =>
  rpc('admin_set_report_status', { p_report_id: id, p_status: status, p_reason: reason ?? null })

export const deleteSpot = (id: string, reason?: string) =>
  rpc('admin_delete_spot', { p_spot_id: id, p_reason: reason ?? null })

// ----- bulk RPCs (migration 0020) -----

export const setSpotsStatusBulk = (ids: string[], status: SpotStatus, reason?: string) =>
  rpc('admin_set_spots_status', { p_ids: ids, p_status: status, p_reason: reason ?? null })

export const setRatingsStatusBulk = (ids: string[], status: ReviewStatus, reason?: string) =>
  rpc('admin_set_ratings_status', { p_ids: ids, p_status: status, p_reason: reason ?? null })

export const setPhotosStatusBulk = (ids: string[], status: PhotoStatus, reason?: string) =>
  rpc('admin_set_photos_status', { p_ids: ids, p_status: status, p_reason: reason ?? null })

export const setReportsStatusBulk = (ids: string[], status: ReportStatus, reason?: string) =>
  rpc('admin_set_reports_status', { p_ids: ids, p_status: status, p_reason: reason ?? null })

// ----- admin user management (migration 0021) -----

export interface AdminUser {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  role: string
  created_at: string | null
  total: number
}

export async function fetchAdminUsers(params: { search?: string; limit?: number; offset?: number }): Promise<AdminUser[]> {
  const res = await supabase.rpc('admin_list_users', {
    p_search: params.search ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  })
  return unwrap<AdminUser[]>(res)
}

export const setUserRole = (userId: string, role: 'admin' | 'user') =>
  rpc('admin_set_user_role', { p_user_id: userId, p_role: role })
