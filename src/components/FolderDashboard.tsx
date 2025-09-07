"use client"
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReviewModal from '@/components/ReviewModal'

export default function FolderDashboard({ folderId, onSelectFolder, onOpenNote }: { folderId: string | null, onSelectFolder?: (id: string) => void, onOpenNote?: (id: string)=>void }) {
  const qc = useQueryClient()
  const todayQuery = useQuery({
    queryKey: ['metrics', folderId, 'today'],
    queryFn: async () => {
      if (!folderId) return null
      const res = await fetch(`/api/folders/${folderId}/metrics/today`)
      if (!res.ok) throw new Error('Failed metrics')
      return res.json()
    },
    enabled: !!folderId,
  })
  const childrenQuery = useQuery({
    queryKey: ['folders', folderId, 'children'],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/folders/${folderId}/children`)
      return res.json()
    },
    enabled: !!folderId,
  })
  const notesQuery = useQuery({
    queryKey: ['notes', folderId, 'dashboard'],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/notes?folderId=${folderId}`)
      return res.json()
    },
    enabled: !!folderId,
  })
  const tasksQuery = useQuery({
    queryKey: ['pending-anki', folderId],
    queryFn: async () => {
      if (!folderId) return []
      const res = await fetch(`/api/folders/${folderId}/pending-anki`)
      return res.json()
    },
    enabled: !!folderId,
  })
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null as any)
  const [reviewNoteId, setReviewNoteId] = React.useState<string | null>(null)
  const [reviewMode, setReviewMode] = React.useState<'all'|'pending'>('pending')
  const [reviewFolderId, setReviewFolderId] = React.useState<string | null>(null)
  const [doneFolders, setDoneFolders] = React.useState<Set<string>>(new Set())
  const closeDay = useMutation({
    mutationFn: async () => {
      if (!folderId) return null
      const res = await fetch(`/api/folders/${folderId}/metrics/close-day`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed close day')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metrics', folderId, 'today'] })
    }
  })

  if (!folderId) return <div className="p-4 text-sm text-gray-500">Select a folder</div>
  const data = todayQuery.data as any
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Strength</div>
          <div className="text-2xl font-semibold">{data?.strength?.percent ?? 0}%</div>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Completion Today</div>
          <div className="text-2xl font-semibold">{data?.completion?.percent ?? 0}%</div>
          <div className="text-xs text-gray-400">{data?.completion?.doneTodayCount ?? 0}/{data?.completion?.dueCount ?? 0}</div>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Streak</div>
          <div className="text-2xl font-semibold">{data?.streak ?? 0}🔥</div>
          <button className="mt-2 rounded bg-indigo-600 px-3 py-1 text-white text-sm" onClick={() => closeDay.mutate()}>
            Count today
          </button>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Subfolders</div>
          <button
            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
            onClick={async () => {
              if (!folderId) return
              const name = prompt('New folder name?')
              if (!name) return
              await fetch('/api/folders', { method: 'POST', body: JSON.stringify({ name, parentId: folderId }) })
              qc.invalidateQueries({ queryKey: ['folders', folderId, 'children'] })
              qc.invalidateQueries({ queryKey: ['folders', 'tree'] })
            }}
          >
            + Add folder
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(childrenQuery.data || []).map((f: any) => (
            <ChildFolderCard key={f.id} folder={f} onClick={() => onSelectFolder?.(f.id)} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Notes</div>
          <button
            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
            onClick={async () => {
              if (!folderId) return
              const title = prompt('New note title:')
              if (!title) return
              await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ folderId, title, content: '' }) })
              qc.invalidateQueries({ queryKey: ['notes', folderId, 'dashboard'] })
              qc.invalidateQueries({ queryKey: ['notes', folderId] })
            }}
          >
            + Add note
          </button>
        </div>
        <div className="max-h-64 space-y-2 overflow-auto rounded border p-2">
          {(notesQuery.data || []).map((n: any) => (
            <div key={n.id} className="flex items-center justify-between rounded bg-white p-3 shadow">
              <button className="truncate text-left text-sm text-indigo-700 hover:underline" onClick={()=>onOpenNote?.(n.id)}>{n.title || 'Untitled'}</button>
              <div className="flex items-center gap-2">
                <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={()=>{ setReviewMode('pending'); setReviewNoteId(n.id) }}>Revise Pending</button>
                <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white" onClick={()=>{ setReviewMode('all'); setReviewNoteId(n.id) }}>Revise All</button>
                <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={()=>setDeleteTarget(n.id)}>⋯</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 text-sm font-semibold">Tasks for the day</div>
        <div className="space-y-2">
          {tasksQuery.data && tasksQuery.data.length > 0 ? (
            tasksQuery.data.map((t: any) => {
              const isDone = doneFolders.has(t.folderId)
              const notesStr = (t.notes || []).map((n: any) => `${n.title} - ${n.dueCount}`).join(', ')
              const label = t.relativePath ? `${t.relativePath} - ${notesStr}` : notesStr || '(this folder)'
              return (
                <div key={t.folderId} className="flex items-center justify-between rounded bg-white p-3 shadow">
                  <div className={`text-sm ${isDone ? 'line-through text-gray-400' : ''}`}>
                    {label}
                  </div>
                  <button
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                    onClick={() => { setReviewMode('pending'); setReviewFolderId(t.folderId) }}
                  >
                    Do Now
                  </button>
                </div>
              )
            })
          ) : (
            <div className="rounded bg-white p-3 text-sm text-gray-500 shadow">Done for the day</div>
          )}
        </div>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-white p-4 shadow">
            <div className="mb-2 text-sm font-semibold">Delete note?</div>
            <div className="mb-4 text-sm text-gray-600">This action cannot be undone.</div>
            <div className="text-right">
              <button className="mr-2 rounded bg-gray-200 px-3 py-1 text-sm" onClick={()=>setDeleteTarget(null)}>Cancel</button>
              <button className="rounded bg-red-600 px-3 py-1 text-sm text-white" onClick={async ()=>{
                await fetch(`/api/notes/${deleteTarget}`, { method: 'DELETE' })
                setDeleteTarget(null)
                qc.invalidateQueries({ queryKey: ['notes', folderId, 'dashboard'] })
                qc.invalidateQueries({ queryKey: ['notes', folderId] })
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {reviewNoteId && (
        <ReviewModal open={!!reviewNoteId} onClose={()=>setReviewNoteId(null)} noteId={reviewNoteId} mode={reviewMode} />
      )}
      {reviewFolderId && (
        <ReviewModal
          open={!!reviewFolderId}
          onClose={() => {
            setDoneFolders((prev) => new Set(prev).add(reviewFolderId))
            setReviewFolderId(null)
          }}
          folderId={reviewFolderId}
          mode="pending"
        />
      )}
    </div>
  )
}

function ChildFolderCard({ folder, onClick }: { folder: any; onClick?: () => void }) {
  const metricsQuery = useQuery({
    queryKey: ['metrics', folder.id, 'today'],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folder.id}/metrics/today`)
      return res.json()
    }
  })
  const strength = metricsQuery.data?.strength?.percent ?? 0
  return (
    <button onClick={onClick} className="flex flex-col rounded border bg-white p-3 text-left shadow hover:shadow-md">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded" style={{ backgroundColor: folder.color }} />
        <span className="font-medium">{folder.name}</span>
      </div>
      <div className="text-xs text-gray-500">Strength: {strength}%</div>
    </button>
  )
}
