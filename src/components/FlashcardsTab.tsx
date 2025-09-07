"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReviewModal from '@/components/ReviewModal'
import { useState } from 'react'

export default function FlashcardsTab({ folderId }: { folderId: string | null }) {
  const qc = useQueryClient()
  const [showAnswerId, setShowAnswerId] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState<'all'|'pending'>('pending')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [frontDraft, setFrontDraft] = useState('')
  const [backDraft, setBackDraft] = useState('')
  const { data } = useQuery({
    queryKey: ['cards', folderId],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/cards?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })
  const notesQuery = useQuery({
    queryKey: ['notes', folderId, 'for-cards'],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/notes?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })

  const create = useMutation({
    mutationFn: async (payload: { noteId: string; front: string; back: string }) => {
      const res = await fetch('/api/cards', { method: 'POST', body: JSON.stringify(payload) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', folderId] })
  })

  async function review(id: string, result: 'good' | 'again') {
    await fetch(`/api/cards/${id}/review`, { method: 'POST', body: JSON.stringify({ result }) })
    setShowAnswerId(null)
    qc.invalidateQueries({ queryKey: ['cards', folderId] })
  }

  return (
    <div className="space-y-3">
      <div className="rounded bg-white p-2 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Add Card</div>
          <div className="flex gap-2">
            <button className="rounded bg-gray-200 px-3 py-1 text-sm" onClick={() => { setReviewMode('pending'); setReviewOpen(true) }}>Revise Pending</button>
            <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => { setReviewMode('all'); setReviewOpen(true) }}>Revise All</button>
          </div>
        </div>
        <div className="flex gap-2">
          <select id="card-note" className="rounded border p-1 text-sm">
            <option value="">Select note</option>
            {(notesQuery.data || []).map((n: any) => (
              <option key={n.id} value={n.id}>{n.title || 'Untitled'}</option>
            ))}
          </select>
          <input id="card-front" className="flex-1 rounded border p-1 text-sm" placeholder="Front" />
          <input id="card-back" className="flex-1 rounded border p-1 text-sm" placeholder="Back" />
          <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => {
            const noteId = (document.getElementById('card-note') as HTMLSelectElement).value
            const front = (document.getElementById('card-front') as HTMLInputElement).value
            const back = (document.getElementById('card-back') as HTMLInputElement).value
            if (!noteId || !front || !back) return
            create.mutate({ noteId, front, back })
            ;(document.getElementById('card-front') as HTMLInputElement).value = ''
            ;(document.getElementById('card-back') as HTMLInputElement).value = ''
            ;(document.getElementById('card-note') as HTMLSelectElement).value = ''
          }}>Add Card</button>
        </div>
      </div>
      <div className="space-y-2">
        {(data || []).map((c: any) => (
          <div key={c.id} className="rounded bg-white p-2 shadow">
            <div className="text-sm font-medium">{c.front}</div>
            {showAnswerId === c.id ? (
              <div className="mt-2 text-sm">{c.back}</div>
            ) : null}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{c.nextDue ? `Due: ${new Date(c.nextDue).toDateString()}` : 'Not scheduled'}</span>
              {showAnswerId === c.id ? (
                <>
                  <button className="rounded bg-emerald-500 px-2 py-0.5 text-white" onClick={() => review(c.id, 'good')}>Good</button>
                  <button className="rounded bg-orange-500 px-2 py-0.5 text-white" onClick={() => review(c.id, 'again')}>Again</button>
                </>
              ) : (
                <button className="rounded bg-gray-200 px-2 py-0.5" onClick={() => setShowAnswerId(c.id)}>Show answer</button>
              )}
              <button className="ml-auto rounded bg-gray-200 px-2 py-0.5" onClick={()=>{ setEditId(c.id); setFrontDraft(c.front); setBackDraft(c.back); setEditOpen(true) }}>Edit</button>
              <button className="ml-2 rounded bg-red-600 px-2 py-0.5 text-white" onClick={async ()=>{
                if (!confirm('Delete this card?')) return
                await fetch(`/api/cards/${c.id}`, { method: 'DELETE' })
                qc.invalidateQueries({ queryKey: ['cards', folderId] })
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} folderId={folderId || undefined} mode={reviewMode} />
      {editOpen && editId && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-4 shadow">
            <div className="mb-2 text-sm font-semibold">Edit Card</div>
            <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="Front" value={frontDraft} onChange={(e)=>setFrontDraft(e.target.value)} />
            <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="Back" value={backDraft} onChange={(e)=>setBackDraft(e.target.value)} />
            <div className="text-right">
              <button className="mr-2 rounded bg-gray-200 px-3 py-1 text-sm" onClick={()=>{ setEditOpen(false); setEditId(null) }}>Cancel</button>
              <button className="rounded bg-emerald-600 px-3 py-1 text-sm text-white" onClick={async ()=>{
                await fetch(`/api/cards/${editId}`, { method: 'PATCH', body: JSON.stringify({ front: frontDraft, back: backDraft }) })
                setEditOpen(false)
                setEditId(null)
                qc.invalidateQueries({ queryKey: ['cards', folderId] })
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
