"use client"
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ReviewModal from '@/components/ReviewModal'

type Props = {
  noteId: string
  onBack: (folderId: string) => void
}

export type NoteDetailHandle = { save: () => Promise<void> }

function NoteDetailImpl({ noteId, onBack }: Props, ref: React.Ref<NoteDetailHandle>) {
  const qc = useQueryClient()
  const [view, setView] = useState<'edit'|'view'>('edit')
  const [tab, setTab] = useState<'note'|'anki'>('note')
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string|null>(null)
  const [frontDraft, setFrontDraft] = useState('')
  const [backDraft, setBackDraft] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState<'all'|'pending'>('pending')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [slashOpen, setSlashOpen] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  const noteQuery = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${noteId}`)
      return res.json()
    }
  })
  const note = noteQuery.data
  useEffect(() => {
    if (note?.content !== undefined) setContent(note.content)
    if (note?.title !== undefined) setTitle(note.title)
  }, [note?.content, note?.title])

  // Initialize the view mode based on content when opening a note
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current && note) {
      const hasContent = !!(note.content && note.content.trim().length > 0)
      setView(hasContent ? 'view' : 'edit')
      initializedRef.current = true
    }
  }, [note])

  const cardsQuery = useQuery({
    queryKey: ['cards', noteId],
    queryFn: async () => {
      const res = await fetch(`/api/cards?noteId=${noteId}`)
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(body) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note', noteId] })
  })

  async function saveIfNeeded() {
    if (content !== (note?.content || '')) {
      await saveMutation.mutateAsync({ title: (title || '').trim() || 'Untitled', content })
    }
  }

  useImperativeHandle(ref, () => ({
    save: saveIfNeeded,
  }))

  function insertAtCursor(text: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const before = content.slice(0, start)
    const after = content.slice(end)
    const newVal = before + text + after
    setContent(newVal)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    }, 0)
  }

  const slashOptions = useMemo(() => ([
    { key: 'h1', label: 'Heading 1', insert: '\n# ' },
    { key: 'h2', label: 'Heading 2', insert: '\n## ' },
    { key: 'h3', label: 'Heading 3', insert: '\n### ' },
    { key: 'text', label: 'Text', insert: '\n' },
    { key: 'table', label: 'Table', insert: '\n| Col 1 | Col 2 |\n| --- | --- |\n|  |  |\n' },
  ]), [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === '/') {
      setSlashOpen(true)
    } else if (e.key === 'Escape') {
      setSlashOpen(false)
    }
  }

  if (!note) return <div className="p-4">Loading...</div>

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded bg-gray-200 px-3 py-1 text-sm" onClick={async () => { await saveIfNeeded(); onBack(note.folderId) }}>
            ← Back
          </button>
          <div className="text-sm text-gray-500">Note</div>
        </div>
        {tab === 'note' && (
          <div className="flex items-center gap-2">
            <div className="rounded bg-gray-100 p-1 text-xs">
              <button className={`rounded px-2 py-1 ${view==='edit'?'bg-white shadow':''}`} onClick={() => setView('edit')}>Edit</button>
              <button className={`rounded px-2 py-1 ${view==='view'?'bg-white shadow':''}`} onClick={() => setView('view')}>View</button>
            </div>
            <div className="ml-2 flex items-center gap-2">
              <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={()=>{ setReviewMode('pending'); setReviewOpen(true) }}>Revise Pending</button>
              <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white" onClick={()=>{ setReviewMode('all'); setReviewOpen(true) }}>Revise All</button>
            </div>
            {view==='edit' && (
              <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => saveMutation.mutate({ title: (title || '').trim() || 'Untitled', content })}>
                Save
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button className={`rounded px-3 py-1 ${tab==='note'?'bg-indigo-600 text-white':'bg-gray-100'}`} onClick={() => setTab('note')}>Notes</button>
        <button className={`rounded px-3 py-1 ${tab==='anki'?'bg-indigo-600 text-white':'bg-gray-100'}`} onClick={() => setTab('anki')}>Anki Style questions</button>
      </div>

      {tab === 'note' ? (
        view === 'edit' ? (
          <div className="relative">
            <input
              className="mb-2 w-full rounded border p-2 text-lg font-semibold"
              placeholder="Title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
            />
            <textarea
              ref={textareaRef}
              className="h-[60vh] w-full rounded border p-3 font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type '/' for commands (h1, h2, h3, text, table)"
            />
            {slashOpen && (
              <div className="absolute left-3 top-3 z-10 w-56 rounded border bg-white p-1 shadow">
                {slashOptions.map((opt) => (
                  <button
                    key={opt.key}
                    className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                    onClick={() => { insertAtCursor(opt.insert); setSlashOpen(false) }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="prose max-w-none rounded bg-white p-4 shadow">
            <h1>{title || 'Untitled'}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => { setFrontDraft(''); setBackDraft(''); setShowAddCard(true) }}>
              + New Card
            </button>
          </div>
          <table className="w-full table-auto overflow-hidden rounded bg-white shadow">
            <thead>
              <tr className="bg-gray-50 text-left text-sm">
                <th className="p-2">Front</th>
                <th className="p-2">Back</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(cardsQuery.data || []).map((c: any) => (
                <tr key={c.id} className="border-t text-sm">
                  <td className="p-2">
                    {editingCardId===c.id ? (
                      <input className="w-full rounded border p-1" value={frontDraft} onChange={(e)=>setFrontDraft(e.target.value)} />
                    ) : (
                      <span>{c.front}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {editingCardId===c.id ? (
                      <input className="w-full rounded border p-1" value={backDraft} onChange={(e)=>setBackDraft(e.target.value)} />
                    ) : (
                      <span>{c.back}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {editingCardId===c.id ? (
                      <>
                        <button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={async ()=>{
                          await fetch(`/api/cards/${c.id}`, { method: 'PATCH', body: JSON.stringify({ front: frontDraft, back: backDraft }) })
                          setEditingCardId(null)
                          cardsQuery.refetch()
                        }}>Save</button>
                        <button className="ml-2 rounded bg-gray-200 px-2 py-1 text-xs" onClick={()=>{ setEditingCardId(null) }}>Cancel</button>
                      </>
                    ) : (
                      <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={()=>{ setEditingCardId(c.id); setFrontDraft(c.front); setBackDraft(c.back) }}>✎ Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showAddCard && (
            <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-md rounded bg-white p-4 shadow">
                <div className="mb-2 text-sm font-semibold">New Card</div>
                <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="Front" value={frontDraft} onChange={(e)=>setFrontDraft(e.target.value)} />
                <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="Back" value={backDraft} onChange={(e)=>setBackDraft(e.target.value)} />
                <div className="text-right">
                  <button className="mr-2 rounded bg-gray-200 px-3 py-1 text-sm" onClick={()=>setShowAddCard(false)}>Cancel</button>
                  <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={async ()=>{
                    await fetch('/api/cards', { method: 'POST', body: JSON.stringify({ noteId, front: frontDraft, back: backDraft }) })
                    setShowAddCard(false)
                    cardsQuery.refetch()
                  }}>Add</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <ReviewModal open={reviewOpen} onClose={()=>setReviewOpen(false)} noteId={noteId} mode={reviewMode} />
    </div>
  )
}

const NoteDetail = forwardRef(NoteDetailImpl)
export default NoteDetail
