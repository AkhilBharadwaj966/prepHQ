"use client"
import { useState } from 'react'

type Props = {
  node: { id: string, name: string, color: string, children: any[] }
  selectedId: string | null
  onSelect: (id: string) => void
  refresh: () => void
}

export default function FolderNode({ node, selectedId, onSelect, refresh }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(node.name)
  const isSelected = selectedId === node.id

  async function save() {
    await fetch(`/api/folders/${node.id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    setEditing(false)
    refresh()
  }

  async function remove() {}

  return (
    <div className="pl-2">
      <div className={`relative flex items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100 ${isSelected ? 'bg-gray-200' : ''}`}>
        <button className="h-3 w-3 rounded" style={{ backgroundColor: node.color }} onClick={() => onSelect(node.id)} />
        {editing ? (
          <input className="w-32 rounded border px-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} onBlur={save} />
        ) : (
          <button className="flex-1 text-left text-sm" onDoubleClick={() => setEditing(true)} onClick={() => onSelect(node.id)}>
            {node.name}
          </button>
        )}
        <input
          type="color"
          className="h-5 w-5"
          defaultValue={node.color}
          onChange={async (e) => {
            await fetch(`/api/folders/${node.id}`, { method: 'PATCH', body: JSON.stringify({ color: e.target.value }) })
            refresh()
          }}
          title="Pick color"
        />
        {/* Actions moved to top nav */}
      </div>
      <div className="ml-3 border-l pl-2">
        {node.children?.map((child) => (
          <FolderNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} refresh={refresh} />
        ))}
      </div>

    </div>
  )
}
