import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { NoteUpdateSchema } from '@/lib/validation/note'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = NoteUpdateSchema.parse(await req.json())
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = (data.title || '').trim() || 'Untitled'
    if (data.content !== undefined) updateData.content = data.content
    const updated = await prisma.note.update({ where: { id: params.id }, data: updateData })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.note.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const note = await prisma.note.findUnique({ where: { id: params.id } })
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(note)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
