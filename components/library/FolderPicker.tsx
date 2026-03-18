'use client'

import { useEffect, useRef } from 'react'
import { IconFolder, IconFolderOpen } from '@tabler/icons-react'
import type { Folder } from '@/types/library'

interface Props {
  folders: Folder[]
  currentFolderId: string | null
  onSelect: (folderId: string | null) => void
  onClose: () => void
}

export default function FolderPicker({ folders, currentFolderId, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSelect(folderId: string | null) {
    onSelect(folderId)
    onClose()
  }

  const sorted = [...folders].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute z-50 mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="py-1 max-h-60 overflow-y-auto">
          <button
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left ${
              currentFolderId === null
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
            onClick={() => handleSelect(null)}
          >
            <IconFolderOpen size={15} className="text-zinc-400 shrink-0" />
            <span>Root (no folder)</span>
          </button>

          {sorted.map(folder => (
            <button
              key={folder.id}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left ${
                currentFolderId === folder.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
              onClick={() => handleSelect(folder.id)}
            >
              <IconFolder size={15} className="text-zinc-400 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}

          {folders.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-500">No folders created yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
