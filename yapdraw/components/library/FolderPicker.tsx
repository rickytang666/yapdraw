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
        className="absolute z-50 mt-1 w-56 rounded-xl shadow-xl overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="py-1 max-h-60 overflow-y-auto">
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left"
            style={{
              background: currentFolderId === null ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-secondary)',
            }}
            onClick={() => handleSelect(null)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseLeave={e => {
              e.currentTarget.style.background = currentFolderId === null ? 'var(--bg-tertiary)' : 'transparent'
            }}
          >
            <IconFolderOpen size={15} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <span>Root</span>
          </button>

          {sorted.map(folder => (
            <button
              key={folder.id}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left"
              style={{
                background: currentFolderId === folder.id ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-secondary)',
              }}
              onClick={() => handleSelect(folder.id)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => {
                e.currentTarget.style.background = currentFolderId === folder.id ? 'var(--bg-tertiary)' : 'transparent'
              }}
            >
              <IconFolder size={15} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}

          {folders.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>No folders yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
