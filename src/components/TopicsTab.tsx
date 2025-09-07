"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function TopicsTab({ folderId }: { folderId: string | null }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['topics', folderId],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/topics?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })

  const create = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/topics', { method: 'POST', body: JSON.stringify({ folderId, title }) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics', folderId] })
  })

  async function toggleDone(id: string, done: boolean) {
    await fetch(`/api/topics/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) })
    qc.invalidateQueries({ queryKey: ['topics', folderId] })
  }

  async function remove(id: string) {
    await fetch(`/api/topics/${id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['topics', folderId] })
  }

  return (
    <div className="space-y-3">
      <div className="rounded bg-white p-2 shadow">
        <div className="flex gap-2">
          <input id="topic-title" className="flex-1 rounded border p-1 text-sm" placeholder="Topic" />
          <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => {
            const title = (document.getElementById('topic-title') as HTMLInputElement).value
            if (!title) return
            create.mutate(title)
            ;(document.getElementById('topic-title') as HTMLInputElement).value = ''
          }}>Add Topic</button>
        </div>
      </div>
      <div className="space-y-2">
        {(data || []).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between rounded bg-white p-2 shadow">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={t.done} onChange={(e) => toggleDone(t.id, e.target.checked)} />
              <span className={t.done ? 'line-through text-gray-500' : ''}>{t.title}</span>
            </label>
            <button className="text-xs text-red-500" onClick={() => remove(t.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

