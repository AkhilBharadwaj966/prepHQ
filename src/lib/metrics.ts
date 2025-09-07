import dayjs from 'dayjs'
import { prisma } from '@/lib/db'
import { getSubtreeIds } from '@/lib/tree'

export type Strength = {
  percent: number
  topicsCompleted: number
  topicsTotal: number
}

export async function computeStrength(folderId: string): Promise<Strength> {
  const ids = await getSubtreeIds(folderId)
  const [total, completed] = await Promise.all([
    prisma.topic.count({ where: { folderId: { in: ids } } }),
    prisma.topic.count({ where: { folderId: { in: ids }, done: true } }),
  ])
  const percent = total === 0 ? 0 : Math.round((100 * completed) / total)
  return { percent, topicsCompleted: completed, topicsTotal: total }
}

export type CompletionToday = {
  percent: number
  dueCount: number
  doneTodayCount: number
}

export async function computeCompletionToday(folderId: string, date = new Date()): Promise<CompletionToday> {
  const ids = await getSubtreeIds(folderId)
  const end = dayjs(date).endOf('day').toDate()
  const start = dayjs(date).startOf('day').toDate()

  const dueCount = await prisma.task.count({
    where: {
      folderId: { in: ids },
      OR: [
        { nextDue: { lte: end } },
        { due: { lte: end } },
      ],
    },
  })

  const doneTodayCount = await prisma.taskCompletion.count({
    where: {
      task: { folderId: { in: ids } },
      doneOn: { gte: start, lte: end },
    },
  })

  const percent = dueCount === 0 ? 0 : Math.round((100 * doneTodayCount) / dueCount)
  return { percent, dueCount, doneTodayCount }
}

export const COMPLETION_THRESHOLD_DEFAULT = 60

export async function closeDayAndMaybeBumpStreak(folderId: string, threshold = COMPLETION_THRESHOLD_DEFAULT) {
  const today = dayjs().startOf('day')
  const [{ percent, topicsCompleted, topicsTotal }, folder] = await Promise.all([
    computeStrength(folderId),
    prisma.folder.findUnique({ where: { id: folderId } }),
  ])
  if (!folder) throw new Error('Folder not found')

  const completion = await computeCompletionToday(folderId, today.toDate())
  const canBump = completion.percent >= threshold && (!folder.lastStreakBumped || !dayjs(folder.lastStreakBumped).isSame(today, 'day'))

  const updated = await prisma.$transaction(async (tx) => {
    const snap = await tx.metricSnapshot.upsert({
      where: { folderId_day: { folderId, day: today.toDate() } },
      update: { completionPercent: completion.percent, topicsCompleted, topicsTotal, streak: folder.currentStreak },
      create: { folderId, day: today.toDate(), completionPercent: completion.percent, topicsCompleted, topicsTotal, streak: folder.currentStreak },
    })
    let newFolder = folder
    if (canBump) {
      newFolder = await tx.folder.update({
        where: { id: folderId },
        data: { currentStreak: { increment: 1 }, lastStreakBumped: today.toDate() },
      })
      await tx.metricSnapshot.update({ where: { id: snap.id }, data: { streak: newFolder.currentStreak } })
    }
    return newFolder
  })

  return { completion, strength: { percent, topicsCompleted, topicsTotal }, streak: updated.currentStreak, bumped: canBump }
}

