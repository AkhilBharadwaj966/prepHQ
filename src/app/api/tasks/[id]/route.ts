import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { TaskUpdateSchema } from '@/lib/validation/task'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = TaskUpdateSchema.parse(await req.json())
    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: data.title ?? undefined,
        kind: (data.kind as any) ?? undefined,
        linkId: data.linkId ?? undefined,
        due: data.due === null ? null : data.due ? new Date(data.due) : undefined,
        nextDue: data.nextDue === null ? null : data.nextDue ? new Date(data.nextDue) : undefined,
        intervalIndex: data.intervalIndex ?? undefined,
      }
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.task.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

