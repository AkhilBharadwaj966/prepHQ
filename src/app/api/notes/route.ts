import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { NoteCreateSchema } from '@/lib/validation/note'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const where = folderId ? { folderId } : {}
  const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(notes)
}

export async function POST(req: Request) {
  try {
    const data = NoteCreateSchema.parse(await req.json())
    const created = await prisma.note.create({ data: { folderId: data.folderId, title: data.title, content: data.content } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
