"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function TasksTab({ folderId }: { folderId: string | null }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['tasks', folderId],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/tasks?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })

  const create = useMutation({
    mutationFn: async (payload: { title: string; due?: string }) => {
      const res = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify({ folderId, title: payload.title, kind: 'custom', due: payload.due }) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', folderId] })
  })

  async function toggleToday(id: string, done: boolean) {
    const url = `/api/tasks/${id}/completeToday`
    await fetch(url, { method: done ? 'DELETE' : 'POST' })
    qc.invalidateQueries({ queryKey: ['tasks', folderId] })
  }

  return (
    <div className="space-y-3">
      <div className="rounded bg-white p-2 shadow">
        <div className="flex gap-2">
          <input id="task-title" className="flex-1 rounded border p-1 text-sm" placeholder="Task title" />
          <input id="task-due" type="date" className="rounded border p-1 text-sm" />
          <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => {
            const title = (document.getElementById('task-title') as HTMLInputElement).value
            const dueEl = (document.getElementById('task-due') as HTMLInputElement)
            const due = dueEl.value ? new Date(dueEl.value).toISOString() : undefined
            if (!title) return
            create.mutate({ title, due })
            ;(document.getElementById('task-title') as HTMLInputElement).value = ''
            dueEl.value = ''
          }}>Add Task</button>
        </div>
      </div>
      <div className="space-y-2">
        {(data || []).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between rounded bg-white p-2 shadow">
            <div>
              <div className="text-sm">{t.title}</div>
              <div className="text-xs text-gray-500">{t.due ? `Due: ${new Date(t.due).toDateString()}` : t.nextDue ? `SR Due: ${new Date(t.nextDue).toDateString()}` : 'No due'}</div>
            </div>
            <button className="rounded bg-gray-200 px-2 py-0.5 text-xs" onClick={() => toggleToday(t.id, !!t.doneToday)}>
              {t.doneToday ? 'Unmark today' : 'Mark done today'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

