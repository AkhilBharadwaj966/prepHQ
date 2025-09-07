"use client"
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import FolderNode from './FolderNode'

export default function FolderTree({ onSelect }: { onSelect: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const { data, refetch } = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/folders/tree')
      return res.json()
    }
  })

  // Intentionally avoid auto-calling onSelect on rerenders to prevent
  // unintended navigation (e.g., when opening a note).

  async function addRoot() {
    const name = prompt('Folder name?')
    if (!name) return
    await fetch('/api/folders', { method: 'POST', body: JSON.stringify({ name }) })
    refetch()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        <div className="text-sm font-semibold">Folders</div>
        <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white" onClick={addRoot}>+ Add</button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {data?.map((node: any) => (
          <FolderNode key={node.id} node={node} selectedId={selected} onSelect={(id)=>{ setSelected(id); onSelect(id) }} refresh={() => refetch()} />
        ))}
      </div>
    </div>
  )
}
