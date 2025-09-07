import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
  const start = dayjs().startOf('day').toDate()
  const done = await prisma.taskCompletion.upsert({
    where: { taskId_doneOn: { taskId: params.id, doneOn: start } },
    update: {},
    create: { taskId: params.id, doneOn: start },
  })
  return NextResponse.json(done)
}

export async function DELETE(_req: Request, { params }: Params) {
  const start = dayjs().startOf('day').toDate()
  await prisma.taskCompletion.deleteMany({ where: { taskId: params.id, doneOn: start } })
  return NextResponse.json({ ok: true })
}

