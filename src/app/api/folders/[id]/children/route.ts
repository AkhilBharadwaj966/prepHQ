import { NextResponse } from 'next/server'
import { getChildren } from '@/lib/tree'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const children = await getChildren(params.id)
  return NextResponse.json(children)
}

