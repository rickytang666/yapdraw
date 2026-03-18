'use client'

import { useEffect } from 'react'
import {
  IconPencil,
  IconFolderPlus,
  IconTrash,
} from '@tabler/icons-react'
import type { Folder } from '@/types/library'

interface Props {
  folder: Folder
  position: { x: number; y: number }
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onAddSubfolder: () => void
}

export default function FolderContextMenu({
  folder,
  position,
  onClose,
  onRename,
  onDelete,
  onAddSubfolder,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleItem(fn: () => void) {
    fn()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden py-1 min-w-[160px]"
        style={{ top: position.y, left: position.x }}
      >
        <div className="px-3 py-1.5 text-xs text-zinc-500 font-medium truncate border-b border-zinc-700 mb-1">
          {folder.name}
        </div>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onRename)}
        >
          <IconPencil size={14} className="shrink-0" />
          Rename
        </button>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onAddSubfolder)}
        >
          <IconFolderPlus size={14} className="shrink-0" />
          Add Subfolder
        </button>

        <div className="my-1 border-t border-zinc-700" />

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors text-left"
          onClick={() => handleItem(onDelete)}
        >
          <IconTrash size={14} className="shrink-0" />
          Delete
        </button>
      </div>
    </>
  )
}
