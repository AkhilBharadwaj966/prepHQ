import dayjs from 'dayjs'

export const SR_INTERVALS_DAYS = [1, 3, 7, 15] as const
export type SRResult = 'good' | 'again'

export function nextIndex(current: number | null | undefined, result: SRResult): number {
  const idx = current ?? 0
  if (result === 'again') return 0
  return Math.min(idx + 1, SR_INTERVALS_DAYS.length - 1)
}

export function nextDueFrom(index: number, from: Date = new Date()): Date {
  const days = SR_INTERVALS_DAYS[index]
  return dayjs(from).add(days, 'day').startOf('day').toDate()
}

export function scheduleFromResult(currentIndex: number | null | undefined, result: SRResult, from?: Date) {
  const index = nextIndex(currentIndex, result)
  const nextDue = nextDueFrom(index, from)
  return { index, nextDue }
}

