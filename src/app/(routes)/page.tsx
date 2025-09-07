"use client"
import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
    </div>
  )
}
