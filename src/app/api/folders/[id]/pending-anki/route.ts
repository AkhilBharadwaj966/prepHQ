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
    select: { id: true, folderId: true },
  })

  const byFolder = new Map<string, number>()
  for (const c of cards) {
    byFolder.set(c.folderId, (byFolder.get(c.folderId) || 0) + 1)
  }

  const result: Array<{ folderId: string; relativePath: string; dueCount: number }> = []
  for (const [fid, dueCount] of byFolder) {
    const path = await getFolderPath(fid)
    // make relative (drop everything up to and including base)
    const idx = path.findIndex((p) => p.id === baseId)
    const rel = idx >= 0 ? path.slice(idx + 1) : path
    const relativePath = rel.map((p) => p.name).join(' / ')
    result.push({ folderId: fid, relativePath, dueCount })
  }

  // sort by path for stable order
  result.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return NextResponse.json(result)
}
