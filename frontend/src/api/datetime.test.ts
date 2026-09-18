import { describe, expect, it } from 'vitest'
import { formatDate, parseUtc } from './datetime'

describe('parseUtc', () => {
  it('reads a bare task timestamp as UTC, not local time', () => {
    // the bug this exists for: new Date() would read this as local time
    expect(parseUtc('2026-09-17T18:58:40.935').toISOString()).toBe('2026-09-17T18:58:40.935Z')
  })

  it('leaves an explicit Z alone', () => {
    expect(parseUtc('2026-09-17T00:00:00Z').toISOString()).toBe('2026-09-17T00:00:00.000Z')
  })

  it('leaves an explicit offset alone', () => {
    expect(parseUtc('2026-09-17T01:00:00+01:00').toISOString()).toBe('2026-09-17T00:00:00.000Z')
  })

  it('agrees with the native parser once the marker is present', () => {
    const bare = '2026-01-05T23:30:00'
    expect(parseUtc(bare).getTime()).toBe(new Date(`${bare}Z`).getTime())
  })

  it('does not shift a date across midnight in a positive-offset zone', () => {
    // 23:30 UTC on the 16th is still the 16th in UTC; only the display zone may move it
    expect(formatDate('2026-09-16T23:30:00', 'UTC')).toContain('16')
    expect(formatDate('2026-09-16T23:30:00', 'Africa/Douala')).toContain('17')
  })
})
