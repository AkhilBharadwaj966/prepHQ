import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { prisma } from '@/lib/db'
import { getFolderPath, getSubtreeIds } from '@/lib/tree'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const baseId = params.id
  const ids = await getSubtreeIds(baseId)
  if (ids.length === 0) return NextResponse.json([])

  const end = dayjs().endOf('day').toDate()
  const cards = await prisma.card.findMany({
    where: {
      folderId: { in: ids },
      OR: [{ nextDue: null }, { nextDue: { lte: end } }],
    },
    select: { id: true, folderId: true, noteId: true, note: { select: { id: true, title: true } } },
  })

  // Group by folder then note
  type NoteAgg = { noteId: string; title: string; dueCount: number }
  const byFolder = new Map<string, Map<string, NoteAgg>>()
  for (const c of cards) {
    const fid = c.folderId
    const nid = c.noteId
    if (!byFolder.has(fid)) byFolder.set(fid, new Map())
    const notesMap = byFolder.get(fid)!
    const key = nid
    const title = c.note?.title || 'Untitled'
    const existing = notesMap.get(key)
    if (existing) existing.dueCount += 1
    else notesMap.set(key, { noteId: nid, title, dueCount: 1 })
  }

  const result: Array<{ folderId: string; relativePath: string; notes: NoteAgg[] }> = []
  for (const [fid, notesMap] of byFolder) {
    const path = await getFolderPath(fid)
    const idx = path.findIndex((p) => p.id === baseId)
    const rel = idx >= 0 ? path.slice(idx + 1) : path
    const relativePath = rel.map((p) => p.name).join(' / ')
    const notes = Array.from(notesMap.values()).sort((a, b) => a.title.localeCompare(b.title))
    result.push({ folderId: fid, relativePath, notes })
  }

  // sort by path for stable order
  result.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return NextResponse.json(result)
}
