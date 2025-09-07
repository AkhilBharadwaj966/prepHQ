import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { scheduleFromResult } from '@/lib/sr'
import { NoteReviewSchema } from '@/lib/validation/note'

type Params = { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  try {
    const { result } = NoteReviewSchema.parse(await req.json())
    const note = await prisma.note.findUnique({ where: { id: params.id } })
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { index, nextDue } = scheduleFromResult(note.intervalIndex ?? 0, result)
    const updated = await prisma.note.update({ where: { id: params.id }, data: { intervalIndex: index, nextDue } })
    // also ensure a corresponding SR task exists (optional for MVP); create/update
    await prisma.task.upsert({
      where: { id: `${params.id}-sr-note` }, // synthetic key pattern avoided; use link instead via findFirst
      update: { nextDue, intervalIndex: index },
      create: { folderId: note.folderId, title: 'Read Note', kind: 'sr_note', linkId: note.id, nextDue, intervalIndex: index },
    }).catch(async () => {
      const existing = await prisma.task.findFirst({ where: { kind: 'sr_note', linkId: note.id } })
      if (existing) {
        await prisma.task.update({ where: { id: existing.id }, data: { nextDue, intervalIndex: index } })
      } else {
        await prisma.task.create({ data: { folderId: note.folderId, title: 'Read Note', kind: 'sr_note', linkId: note.id, nextDue, intervalIndex: index } })
      }
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

