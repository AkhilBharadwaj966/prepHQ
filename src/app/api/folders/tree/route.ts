import { NextResponse } from 'next/server'
import { getFolderTree } from '@/lib/tree'

export async function GET() {
  const tree = await getFolderTree()
  return NextResponse.json(tree)
}

