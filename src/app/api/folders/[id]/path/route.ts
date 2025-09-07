import { NextResponse } from 'next/server'
import { getFolderPath } from '@/lib/tree'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const path = await getFolderPath(params.id)
  return NextResponse.json(path)
}

