import { describe, expect, it } from 'vitest'
import { actionMix, dailyActions, topModerators, type DailyAction } from './analytics'
import type { AuditEntry } from './types'

function makeEntry(action: string, ageDays: number, username: string): AuditEntry {
  const date = new Date(Date.now() - ageDays * 86_400_000)
  return {
    id: crypto.randomUUID(),
    admin_id: null,
    action,
    target_type: action.split('.')[0],
    target_id: 'x',
    details: {},
    created_at: date.toISOString(),
    admin: { username },
  }
}

describe('dailyActions', () => {
  it('produces N buckets for the requested window', () => {
    const out: DailyAction[] = dailyActions([], 7)
    expect(out).toHaveLength(7)
    expect(out[0].date).toBeDefined()
  })

  it('counts approved/rejected/other per day', () => {
    const entries = [
      makeEntry('spot.approved', 0, 'a'),
      makeEntry('spot.rejected', 0, 'a'),
      makeEntry('rating.approved', 0, 'a'),
      makeEntry('report.dismissed', 1, 'b'),
    ]
    const out = dailyActions(entries, 7)
    const today = out[out.length - 1]
    expect(today.approved).toBe(2)
    expect(today.rejected).toBe(1)
    expect(today.other).toBe(0)
    expect(today.total).toBe(3)
  })

  it('ignores entries older than the window', () => {
    const entries = [makeEntry('spot.approved', 100, 'a')]
    const out = dailyActions(entries, 7)
    expect(out.reduce((s, b) => s + b.total, 0)).toBe(0)
  })
})

describe('actionMix', () => {
  it('groups by action prefix and sorts descending', () => {
    const entries = [
      makeEntry('spot.approved', 0, 'a'),
      makeEntry('spot.rejected', 0, 'a'),
      makeEntry('spot.approved', 0, 'a'),
      makeEntry('rating.approved', 0, 'a'),
    ]
    const out = actionMix(entries)
    expect(out[0]).toEqual({ label: 'spot', value: 3 })
    expect(out[1]).toEqual({ label: 'rating', value: 1 })
  })
})

describe('topModerators', () => {
  it('ranks by total and splits approved/rejected', () => {
    const entries = [
      makeEntry('spot.approved', 0, 'alice'),
      makeEntry('spot.rejected', 0, 'alice'),
      makeEntry('rating.approved', 0, 'bob'),
      makeEntry('rating.approved', 0, 'alice'),
    ]
    const out = topModerators(entries, 5)
    expect(out[0]).toEqual({ username: 'alice', total: 3, approved: 2, rejected: 1 })
    expect(out[1]).toEqual({ username: 'bob', total: 1, approved: 1, rejected: 0 })
  })

  it('caps the result list', () => {
    const entries = ['x', 'y', 'z'].map((u) => makeEntry('spot.approved', 0, u))
    expect(topModerators(entries, 2)).toHaveLength(2)
  })
})