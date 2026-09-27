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

export async function fetchSpots(status: SpotStatus): Promise<Spot[]> {
  const res = await supabase
    .from('spots')
    .select(`*, author:profiles!spots_author_id_fkey(${profileRef}), spot_photos(${photoRef})`)
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(100)
  return unwrap<Spot[]>(res)
}

export async function fetchRatings(status: ReviewStatus): Promise<Rating[]> {
  const res = await supabase
    .from('spot_ratings')
    .select(
      `*, author:profiles!spot_ratings_user_id_fkey(${profileRef}),` +
        ` spot:spots!spot_ratings_spot_id_fkey(${spotRef}),` +
        ` photos:spot_photos!spot_photos_review_id_fkey(${photoRef})`,
    )
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(100)
  return unwrap<Rating[]>(res)
}

export async function fetchPhotos(status: PhotoStatus): Promise<Photo[]> {
  const res = await supabase
    .from('spot_photos')
    .select(
      `*, uploader:profiles!spot_photos_user_id_fkey(${profileRef}),` +
        ` spot:spots!spot_photos_spot_id_fkey(${spotRef})`,
    )
    .eq('photo_status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(200)
  return unwrap<Photo[]>(res)
}

export async function fetchReports(status: ReportStatus): Promise<Report[]> {
  const res = await supabase
    .from('spot_reports')
    .select(
      `*, reporter:profiles!spot_reports_reporter_id_fkey(${profileRef}),` +
        ` spot:spots!spot_reports_spot_id_fkey(${spotRef})`,
    )
    .eq('status', status)
    .order('created_at', { ascending: status === 'open' })
    .limit(100)
  return unwrap<Report[]>(res)
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const res = await supabase
    .from('admin_audit_log')
    .select('*, admin:profiles!admin_audit_log_admin_id_fkey(username)')
    .order('created_at', { ascending: false })
    .limit(200)
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

export const setReportStatus = (id: string, status: ReportStatus) =>
  rpc('admin_set_report_status', { p_report_id: id, p_status: status })

export const deleteSpot = (id: string, reason?: string) =>
  rpc('admin_delete_spot', { p_spot_id: id, p_reason: reason ?? null })
