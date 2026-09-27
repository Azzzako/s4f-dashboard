export type SpotStatus = 'pending' | 'approved' | 'rejected'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type PhotoStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatus = 'open' | 'reviewed' | 'dismissed'

export interface ProfileRef {
  id: string
  username: string
  avatar_url: string | null
}

export interface SpotRef {
  id: string
  name: string
  status: SpotStatus
}

export interface PhotoRef {
  id: string
  url: string
  photo_status: PhotoStatus
  position: number
}

export interface Spot {
  id: string
  author_id: string
  name: string
  description: string
  lat: number
  lng: number
  type: string
  difficulty: string
  best_time: string[]
  safety_notes: string | null
  status: SpotStatus
  reject_reason: string | null
  approved_at: string | null
  avg_rating: number
  ratings_count: number
  created_at: string
  updated_at: string
  author: ProfileRef | null
  spot_photos: PhotoRef[]
}

export interface Rating {
  id: string
  spot_id: string
  user_id: string
  rating: number
  comment: string | null
  status: ReviewStatus
  edited: boolean
  created_at: string
  author: ProfileRef | null
  spot: SpotRef | null
  photos: PhotoRef[]
}

export interface Photo {
  id: string
  spot_id: string
  user_id: string
  review_id: string | null
  url: string
  photo_status: PhotoStatus
  created_at: string
  uploader: ProfileRef | null
  spot: SpotRef | null
}

export interface Report {
  id: string
  spot_id: string
  reporter_id: string
  reason: string
  status: ReportStatus
  created_at: string
  reporter: ProfileRef | null
  spot: SpotRef | null
}

export interface AuditEntry {
  id: string
  admin_id: string | null
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
  admin: { username: string } | null
}

export interface PendingCounts {
  spots: number
  ratings: number
  photos: number
  reports: number
}
