import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/tree', () => ({
  getFolderTree: vi.fn().mockResolvedValue([{ id: 'root', name: 'Root', color: '#000', parentId: null, children: [] }])
}))

// Import after mock
// @ts-ignore
import { GET } from '@/app/api/folders/tree/route'

describe('GET /api/folders/tree', () => {
  it('returns tree json', async () => {
    const res = await GET()
    // @ts-ignore
    const json = await res.json()
    expect(json[0].name).toBe('Root')
  })
})

