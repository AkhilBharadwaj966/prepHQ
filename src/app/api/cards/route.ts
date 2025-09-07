import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { CardCreateSchema } from '@/lib/validation/card'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const noteId = searchParams.get('noteId')
  const where = noteId ? { noteId } : folderId ? { folderId } : {}
  const cards = await prisma.card.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(cards)
}

export async function POST(req: Request) {
  try {
    const data = CardCreateSchema.parse(await req.json())
    const note = await prisma.note.findUnique({ where: { id: data.noteId } })
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    const today = new Date()
    const created = await prisma.card.create({
      data: {
        noteId: data.noteId,
        folderId: note.folderId,
        front: data.front,
        back: data.back,
        intervalIndex: 0,
        nextDue: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      }
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
