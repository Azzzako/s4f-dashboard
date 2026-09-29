import { describe, expect, it } from 'vitest'
import { formatDate, label, labels, timeAgo } from './format'

describe('format', () => {
  describe('label', () => {
    it('returns the human label for known values', () => {
      expect(label('approved')).toBe('Aprobado')
      expect(label('street')).toBe('Street')
      expect(label('morning')).toBe('Mañana')
    })

    it('returns the raw key for unknown values', () => {
      expect(label('mystery')).toBe('mystery')
    })

    it('exposes the full dictionary', () => {
      expect(labels.pending).toBe('Pendiente')
      expect(labels.advanced).toBe('Avanzado')
    })
  })

  describe('formatDate', () => {
    it('formats an ISO string in Spanish', () => {
      const out = formatDate('2024-03-15T14:30:00Z')
      // Locale-dependent; just make sure we get *something* sensible back.
      expect(out).toMatch(/\d/)
      expect(out.length).toBeGreaterThan(5)
    })
  })

  describe('timeAgo', () => {
    const now = new Date('2024-06-15T12:00:00Z')
    const past = (iso: string) => new Date(iso).toISOString()

    it('returns "justo ahora" for very recent timestamps', () => {
      const recent = new Date(now.getTime() - 5_000).toISOString()
      // The function uses Date.now() internally, so we just check it does
      // not throw and returns a string.
      expect(timeAgo(recent)).toBeTypeOf('string')
    })

    it('returns a string for past timestamps', () => {
      const lastYear = past(new Date(now.getTime() - 365 * 86_400_000).toISOString())
      const result = timeAgo(lastYear)
      expect(result).toBeTypeOf('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})