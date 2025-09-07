import { describe, it, expect } from 'vitest'
import { nextIndex, nextDueFrom, scheduleFromResult, SR_INTERVALS_DAYS } from '@/lib/sr'

describe('spaced repetition', () => {
  it('bumps index on good', () => {
    expect(nextIndex(0, 'good')).toBe(1)
    expect(nextIndex(3, 'good')).toBe(3)
  })
  it('resets index on again', () => {
    expect(nextIndex(2, 'again')).toBe(0)
    expect(nextIndex(null, 'again')).toBe(0)
  })
  it('computes next due from index', () => {
    const base = new Date('2024-01-01T00:00:00Z')
    const due = nextDueFrom(0, base)
    expect(Math.round((+due - +base) / 86400000)).toBe(SR_INTERVALS_DAYS[0])
  })
  it('scheduleFromResult ties both', () => {
    const base = new Date('2024-01-01T00:00:00Z')
    const { index, nextDue } = scheduleFromResult(1, 'good', base)
    expect(index).toBe(2)
    expect(nextDue instanceof Date).toBe(true)
  })
})

