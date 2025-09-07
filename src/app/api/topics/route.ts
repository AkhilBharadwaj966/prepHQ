import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { TopicCreateSchema } from '@/lib/validation/topic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const where = folderId ? { folderId } : {}
  const topics = await prisma.topic.findMany({ where, orderBy: { title: 'asc' } })
  return NextResponse.json(topics)
}

export async function POST(req: Request) {
  try {
    const data = TopicCreateSchema.parse(await req.json())
    const created = await prisma.topic.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

