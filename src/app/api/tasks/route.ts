import { NextResponse } from 'next/server'
import { z } from 'zod'
import dayjs from 'dayjs'
import { prisma } from '@/lib/db'
import { TaskCreateSchema } from '@/lib/validation/task'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const where = folderId ? { folderId } : {}
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } })
  const start = dayjs().startOf('day').toDate()
  const end = dayjs().endOf('day').toDate()
  const withDoneToday = await Promise.all(tasks.map(async (t) => {
    const doneToday = await prisma.taskCompletion.findFirst({ where: { taskId: t.id, doneOn: { gte: start, lte: end } } })
    return { ...t, doneToday: !!doneToday }
  }))
  return NextResponse.json(withDoneToday)
}

export async function POST(req: Request) {
  try {
    const data = TaskCreateSchema.parse(await req.json())
    const created = await prisma.task.create({
      data: {
        folderId: data.folderId,
        title: data.title,
        kind: data.kind as any,
        linkId: data.linkId,
        due: data.due ? new Date(data.due) : undefined,
        nextDue: data.nextDue ? new Date(data.nextDue) : undefined,
        intervalIndex: data.intervalIndex ?? undefined,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

