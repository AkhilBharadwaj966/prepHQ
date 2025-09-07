"use client"
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import FolderTree from '@/components/FolderTree'
import FolderDashboard from '@/components/FolderDashboard'
import NotesTab from '@/components/NotesTab'
import FlashcardsTab from '@/components/FlashcardsTab'
import TasksTab from '@/components/TasksTab'
import TopicsTab from '@/components/TopicsTab'
import QuickNoteButton from '@/components/QuickNoteButton'
import Breadcrumbs from '@/components/Breadcrumbs'
import NoteDetail, { type NoteDetailHandle } from '@/components/NoteDetail'

type Tab = 'Dashboard' | 'Notes' | 'Flashcards' | 'Tasks' | 'Topics'

export default function HomePage() {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [selectedNoteId, setSelectedNoteId] = useState<string|null>(null)
  const [prevTab, setPrevTab] = useState<Tab | null>(null)
  const noteRef = useRef<NoteDetailHandle | null>(null)
  const qc = useQueryClient()
  const [actionsOpen, setActionsOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const pathQuery = useQuery({
    queryKey: ['folder', folderId, 'path-for-header'],
    queryFn: async () => {
      if (!folderId) return [] as any[]
      const res = await fetch(`/api/folders/${folderId}/path`)
      return res.json()
    },
    enabled: !!folderId,
  })

  async function navigateToFolder(id: string) {
    if (selectedNoteId) {
      await noteRef.current?.save()
      setSelectedNoteId(null)
    }
    setFolderId(id)
  }

  function openNote(id: string) {
    setPrevTab(tab)
    setSelectedNoteId(id)
    setTab('Notes')
  }

  return (
    <div className="grid h-screen grid-cols-[300px_1fr]">
      <aside className="border-r bg-white">
        <FolderTree onSelect={navigateToFolder} />
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between border-b bg-white p-3">
          <div className="flex flex-col">
            <div className="text-lg font-semibold">{pathQuery.data?.[0]?.name ?? ''}</div>
            <Breadcrumbs folderId={folderId} onSelect={navigateToFolder} />
          </div>
          <div className="flex gap-2 text-sm">
            {(['Dashboard','Notes','Flashcards','Tasks','Topics'] as Tab[]).map((t) => (
              <button
                key={t}
                className={`rounded px-3 py-1 ${tab===t? 'bg-indigo-600 text-white':'bg-gray-100'}`}
                onClick={async () => {
                  if (t !== 'Notes' && selectedNoteId) {
                    await noteRef.current?.save()
                    setSelectedNoteId(null)
                  }
                  setTab(t)
                }}
              >
                {t}
              </button>
            ))}
            <div ref={actionsRef} className="relative">
              <button
                className={`rounded px-3 py-1 ${folderId ? 'bg-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                onClick={() => folderId && setActionsOpen((v) => !v)}
                disabled={!folderId}
              >
                Actions ▾
              </button>
              {actionsOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded border bg-white shadow">
                  <button
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-100"
                    onClick={() => { setActionsOpen(false); setConfirmDeleteOpen(true) }}
                  >
                    Delete folder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {selectedNoteId && tab === 'Notes' ? (
            <NoteDetail
              ref={noteRef}
              noteId={selectedNoteId}
              onBack={(fid)=>{
                setSelectedNoteId(null)
                setFolderId(fid)
                if (prevTab) setTab(prevTab)
                setPrevTab(null)
              }}
            />
          ) : (
            <>
              {tab === 'Dashboard' && <FolderDashboard folderId={folderId} onSelectFolder={navigateToFolder} onOpenNote={openNote} />}
              {tab === 'Notes' && <NotesTab folderId={folderId} onOpenNote={openNote} />}
              {tab === 'Flashcards' && <FlashcardsTab folderId={folderId} />}
              {tab === 'Tasks' && <TasksTab folderId={folderId} />}
              {tab === 'Topics' && <TopicsTab folderId={folderId} />}
            </>
          )}
        </div>
        <QuickNoteButton folderId={folderId} />
      </main>
      {confirmDeleteOpen && folderId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-white p-4 shadow">
            <div className="mb-2 text-sm font-semibold">Delete folder?</div>
            <div className="mb-4 text-sm text-gray-600">This will delete this folder and all its contents (notes, cards, topics, tasks) in the subtree. This action cannot be undone.</div>
            <div className="text-right">
              <button className="mr-2 rounded bg-gray-200 px-3 py-1 text-sm" onClick={()=>setConfirmDeleteOpen(false)}>Cancel</button>
              <button className="rounded bg-red-600 px-3 py-1 text-sm text-white" onClick={async ()=>{
                await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
                setConfirmDeleteOpen(false)
                setSelectedNoteId(null)
                setFolderId(null)
                qc.invalidateQueries({ queryKey: ['folders','tree'] })
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
