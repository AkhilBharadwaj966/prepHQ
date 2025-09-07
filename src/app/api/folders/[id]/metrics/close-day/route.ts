import { NextResponse } from 'next/server'
import { closeDayAndMaybeBumpStreak } from '@/lib/metrics'

type Params = { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
  const result = await closeDayAndMaybeBumpStreak(params.id)
  return NextResponse.json(result)
}

