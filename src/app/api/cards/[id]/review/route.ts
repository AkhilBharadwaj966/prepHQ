import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { scheduleFromResult } from '@/lib/sr'
import { CardReviewSchema } from '@/lib/validation/card'

type Params = { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  try {
    const { result } = CardReviewSchema.parse(await req.json())
    const card = await prisma.card.findUnique({ where: { id: params.id } })
    if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { index, nextDue } = scheduleFromResult(card.intervalIndex ?? 0, result)
    const updated = await prisma.card.update({ where: { id: params.id }, data: { intervalIndex: index, nextDue } })
    // sync SR task
    const existing = await prisma.task.findFirst({ where: { kind: 'sr_card', linkId: card.id } })
    if (existing) {
      await prisma.task.update({ where: { id: existing.id }, data: { intervalIndex: index, nextDue } })
    } else {
      await prisma.task.create({ data: { folderId: card.folderId, title: 'Review Card', kind: 'sr_card', linkId: card.id, intervalIndex: index, nextDue } })
    }
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

