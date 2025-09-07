import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
  const note = await prisma.note.update({
    where: { id: params.id },
    data: { intervalIndex: 0, nextDue: dayjs().startOf('day').toDate() },
  })
  return NextResponse.json(note)
}

