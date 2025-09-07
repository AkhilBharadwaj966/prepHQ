import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeStrength, computeCompletionToday } from '@/lib/metrics'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const [strength, completion, folder] = await Promise.all([
    computeStrength(params.id),
    computeCompletionToday(params.id),
    prisma.folder.findUnique({ where: { id: params.id } })
  ])
  return NextResponse.json({ strength, completion, streak: folder?.currentStreak ?? 0 })
}

