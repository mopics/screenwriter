import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { relativeTime } from './time'

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "today" for the same day', () => {
    expect(relativeTime('2026-05-18T08:00:00Z')).toBe('today')
  })

  it('returns "1 day ago" for yesterday', () => {
    expect(relativeTime('2026-05-17T10:00:00Z')).toBe('1 day ago')
  })

  it('returns "N days ago" for multiple days', () => {
    expect(relativeTime('2026-05-14T10:00:00Z')).toBe('4 days ago')
  })

  it('returns "1 week ago" for 7 days', () => {
    expect(relativeTime('2026-05-11T10:00:00Z')).toBe('1 week ago')
  })

  it('returns "N weeks ago" for multiple weeks', () => {
    expect(relativeTime('2026-05-04T10:00:00Z')).toBe('2 weeks ago')
  })

  it('returns "1 month ago" for ~30 days', () => {
    expect(relativeTime('2026-04-18T10:00:00Z')).toBe('1 month ago')
  })
})
