import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { CardUpdateSchema } from '@/lib/validation/card'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = CardUpdateSchema.parse(await req.json())
    const update: any = {}
    if (data.front !== undefined) update.front = data.front
    if (data.back !== undefined) update.back = data.back
    if (data.noteId !== undefined) {
      const note = await prisma.note.findUnique({ where: { id: data.noteId } })
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      update.noteId = data.noteId
      update.folderId = note.folderId
    }
    const updated = await prisma.card.update({ where: { id: params.id }, data: update })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.card.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
