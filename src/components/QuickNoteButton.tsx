"use client"
export default function QuickNoteButton({ folderId }: { folderId: string | null }) {
  if (!folderId) return null
  return (
    <button
      className="fixed bottom-4 right-4 rounded-full bg-indigo-600 px-4 py-2 text-white shadow"
      onClick={async () => {
        const title = prompt('Quick note title:')
        if (!title) return
        const content = prompt('Quick note markdown (optional):') || ''
        await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ folderId, title, content }) })
        location.reload()
      }}
    >
      + Quick Note
    </button>
  )
}
