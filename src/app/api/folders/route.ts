import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FolderCreateSchema } from '@/lib/validation/folder'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const data = FolderCreateSchema.parse(await req.json())
    const created = await prisma.folder.create({ data: { name: data.name, parentId: data.parentId, color: data.color } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parentId = searchParams.get('parentId')
  const folders = await prisma.folder.findMany({ where: { parentId: parentId || null } as any })
  return NextResponse.json(folders)
}

