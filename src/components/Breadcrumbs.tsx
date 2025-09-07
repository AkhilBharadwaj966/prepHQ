"use client"
import { useQuery } from '@tanstack/react-query'

type Props = { folderId: string | null; onSelect: (id: string) => void }

export default function Breadcrumbs({ folderId, onSelect }: Props) {
  const { data } = useQuery({
    queryKey: ['folder', folderId, 'path'],
    queryFn: async () => {
      if (!folderId) return [] as any[]
      const res = await fetch(`/api/folders/${folderId}/path`)
      return res.json()
    },
    enabled: !!folderId,
  })

  if (!folderId || !data?.length) return null
  return (
    <nav className="flex items-center gap-1 text-sm">
      {data.map((p: any, idx: number) => (
        <span key={p.id} className="flex items-center gap-1">
          <button className="text-indigo-700 hover:underline" onClick={() => onSelect(p.id)}>{p.name}</button>
          {idx < data.length - 1 && <span className="text-gray-400">/</span>}
        </span>
      ))}
    </nav>
  )
}

