import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    folder: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'a', parentId: null },
        { id: 'b', parentId: 'a' },
        { id: 'c', parentId: 'b' },
        { id: 'd', parentId: 'a' },
      ])
    }
  }
}))

import { getSubtreeIds } from '@/lib/tree'

describe('getSubtreeIds', () => {
  it('returns DFS list under subtree', async () => {
    const ids = await getSubtreeIds('a')
    expect(ids).toEqual(['a','b','c','d'])
  })
})

