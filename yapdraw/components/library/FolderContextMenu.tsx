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

  const btnClass = "flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left rounded-lg"

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl shadow-xl overflow-hidden py-1.5 min-w-[160px]"
        style={{
          top: position.y,
          left: position.x,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="px-3 py-1.5 text-xs font-medium truncate mb-1" style={{ color: 'var(--text-tertiary)' }}>
          {folder.name}
        </div>

        <button
          className={btnClass}
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => handleItem(onRename)}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-tertiary)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <IconPencil size={14} className="shrink-0" />
          Rename
        </button>

        <button
          className={btnClass}
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => handleItem(onAddSubfolder)}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-tertiary)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <IconFolderPlus size={14} className="shrink-0" />
          Add Subfolder
        </button>

        <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

        <button
          className={btnClass}
          style={{ color: 'var(--danger)' }}
          onClick={() => handleItem(onDelete)}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <IconTrash size={14} className="shrink-0" />
          Delete
        </button>
      </div>
    </>
  )
}
