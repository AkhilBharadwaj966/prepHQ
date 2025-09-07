import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { FolderUpdateSchema } from '@/lib/validation/folder'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = FolderUpdateSchema.parse(await req.json())
    const updated = await prisma.folder.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.folder.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

