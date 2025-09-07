import { prisma } from '@/lib/db'

export type FolderNode = {
  id: string
  name: string
  color: string
  parentId: string | null
  children: FolderNode[]
}

export async function getFolderTree(): Promise<FolderNode[]> {
  const folders = await prisma.folder.findMany({ orderBy: { createdAt: 'asc' } })
  const map = new Map<string, FolderNode>()
  folders.forEach((f) => {
    map.set(f.id, { id: f.id, name: f.name, color: f.color, parentId: f.parentId ?? null, children: [] })
  })
  const roots: FolderNode[] = []
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export async function getSubtreeIds(folderId: string): Promise<string[]> {
  const folders = await prisma.folder.findMany()
  const byParent = new Map<string | null, string[]>()
  folders.forEach((f) => {
    const key = f.parentId ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(f.id)
  })
  const result: string[] = []
  function dfs(id: string) {
    result.push(id)
    const children = byParent.get(id) || []
    children.forEach(dfs)
  }
  dfs(folderId)
  return result
}

export type FolderBasic = { id: string; name: string; color: string; parentId: string | null }

export async function getFolderPath(folderId: string): Promise<FolderBasic[]> {
  const folders = await prisma.folder.findMany()
  const byId = new Map(folders.map((f) => [f.id, f]))
  const path: FolderBasic[] = []
  let cur: any = byId.get(folderId)
  while (cur) {
    path.push({ id: cur.id, name: cur.name, color: cur.color, parentId: cur.parentId ?? null })
    cur = cur.parentId ? byId.get(cur.parentId) : null
  }
  return path.reverse()
}

export async function getChildren(folderId: string | null): Promise<FolderBasic[]> {
  const where = folderId ? { parentId: folderId } : { parentId: null as any }
  const children = await prisma.folder.findMany({ where, orderBy: { createdAt: 'asc' } })
  return children.map((f) => ({ id: f.id, name: f.name, color: f.color, parentId: f.parentId ?? null }))
}
