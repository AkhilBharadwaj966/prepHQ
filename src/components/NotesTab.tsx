"use client"
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReviewModal from '@/components/ReviewModal'

export default function NotesTab({ folderId, onOpenNote }: { folderId: string | null, onOpenNote?: (id: string)=>void }) {
  const qc = useQueryClient()
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [reviewMode, setReviewMode] = React.useState<'all'|'pending'>('pending')
  const { data } = useQuery({
    queryKey: ['notes', folderId],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/notes?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })

  const create = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const res = await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ folderId, title: payload.title, content: payload.content }) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', folderId] })
  })

  async function schedule(id: string) {
    await fetch(`/api/notes/${id}/schedule`, { method: 'POST' })
    qc.invalidateQueries({ queryKey: ['notes', folderId] })
  }

  async function review(id: string, result: 'good' | 'again') {
    await fetch(`/api/notes/${id}/review`, { method: 'POST', body: JSON.stringify({ result }) })
    qc.invalidateQueries({ queryKey: ['notes', folderId] })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button className="rounded bg-gray-200 px-3 py-1 text-sm" onClick={()=>{ setReviewMode('pending'); setReviewOpen(true) }}>Revise Pending</button>
        <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={()=>{ setReviewMode('all'); setReviewOpen(true) }}>Revise All</button>
      </div>
      <div className="rounded bg-white p-2 shadow">
        <input id="note-title" className="mb-2 w-full rounded border p-2 text-sm" placeholder="Title" />
        <textarea className="w-full rounded border p-2 text-sm" placeholder="Write markdown..." id="note-content" />
        <div className="mt-2 text-right">
          <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => {
            const titleEl = document.getElementById('note-title') as HTMLInputElement
            const contentEl = document.getElementById('note-content') as HTMLTextAreaElement
            if (!titleEl?.value) return
            create.mutate({ title: titleEl.value, content: contentEl?.value || '' })
            titleEl.value = ''
            if (contentEl) contentEl.value = ''
          }}>Add Note</button>
        </div>
      </div>
      <ReviewModal open={reviewOpen} onClose={()=>setReviewOpen(false)} folderId={folderId || undefined} mode={reviewMode} />
      <div className="space-y-2">
        {(data || []).map((n: any) => (
          <div key={n.id} className="rounded bg-white p-2 shadow">
            <button className="mb-2 w-full whitespace-pre-wrap text-left text-sm hover:underline" onClick={()=>onOpenNote?.(n.id)}>{n.title || 'Untitled'}</button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {n.nextDue ? <span>Due: {new Date(n.nextDue).toDateString()}</span> : <span>Not scheduled</span>}
              <button className="rounded bg-gray-200 px-2 py-0.5" onClick={() => schedule(n.id)}>Add to SR</button>
              <button className="rounded bg-emerald-500 px-2 py-0.5 text-white" onClick={() => review(n.id, 'good')}>Good</button>
              <button className="rounded bg-orange-500 px-2 py-0.5 text-white" onClick={() => review(n.id, 'again')}>Again</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
