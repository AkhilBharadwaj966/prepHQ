import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { FolderUpdateSchema } from '@/lib/validation/folder'
import { getSubtreeIds } from '@/lib/tree'

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
    const ids = await getSubtreeIds(params.id)
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete dependent records in subtree
      const notes = await tx.note.findMany({ where: { folderId: { in: ids } }, select: { id: true } })
      const noteIds = notes.map((n) => n.id)
      if (noteIds.length) {
        await tx.card.deleteMany({ where: { noteId: { in: noteIds } } })
      }

      const tasks = await tx.task.findMany({ where: { folderId: { in: ids } }, select: { id: true } })
      const taskIds = tasks.map((t) => t.id)
      if (taskIds.length) {
        await tx.taskCompletion.deleteMany({ where: { taskId: { in: taskIds } } })
        await tx.task.deleteMany({ where: { id: { in: taskIds } } })
      }

      await tx.metricSnapshot.deleteMany({ where: { folderId: { in: ids } } })
      await tx.topic.deleteMany({ where: { folderId: { in: ids } } })
      await tx.note.deleteMany({ where: { id: { in: noteIds } } })

      // Delete folders from leaves up to root
      for (const id of ids.slice().reverse()) {
        await tx.folder.delete({ where: { id } })
      }
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
