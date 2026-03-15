'use client'

import { useEffect, useState } from 'react'
import { IconStar, IconStarFilled, IconCopy, IconTrash } from '@tabler/icons-react'
import type { Diagram, Folder } from '@/types/library'

interface Props {
  diagram: Diagram
  folders: Folder[]
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onStar: (starred: boolean) => void
  onDuplicate: () => void
  onTrash: () => void
}

function formatDate(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function DiagramRow({
  diagram,
  folders,
  selected,
  onSelect,
  onOpen,
  onStar,
  onDuplicate,
  onTrash,
}: Props) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const folder = folders.find(f => f.id === diagram.folderId)

  return (
    <div
      className="group flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors"
      style={{
        borderBottom: '1px solid var(--border)',
        background: selected ? 'var(--accent-subtle)' : 'transparent',
      }}
      onClick={onOpen}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.background = 'var(--bg-tertiary)'
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Checkbox */}
      <div
        className="shrink-0"
        onClick={e => { e.stopPropagation(); onSelect() }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Thumbnail */}
      <div
        className="w-10 h-7 rounded-lg overflow-hidden shrink-0"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
      >
        {diagram.thumbnail ? (
          <img
            src={diagram.thumbnail}
            alt={diagram.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[8px]" style={{ color: 'var(--text-tertiary)' }}>--</span>
          </div>
        )}
      </div>

      {/* Name + star */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {diagram.name}
        </p>
        {diagram.starred && (
          <IconStarFilled size={12} style={{ color: 'var(--star)' }} className="shrink-0" />
        )}
      </div>

      {/* Updated */}
      <span className="shrink-0 text-xs tabular-nums hidden sm:inline w-24 text-right" style={{ color: 'var(--text-secondary)' }}>
        {hasMounted ? formatDate(diagram.updatedAt) : ''}
      </span>

      {/* Folder */}
      <span className="shrink-0 w-28 text-xs truncate text-right hidden md:block" style={{ color: 'var(--text-tertiary)' }}>
        {folder ? folder.name : ''}
      </span>

      {/* Actions */}
      <div
        className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-20 justify-end"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onStar(!diagram.starred)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--star)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          {diagram.starred
            ? <IconStarFilled size={14} style={{ color: 'var(--star)' }} />
            : <IconStar size={14} />
          }
        </button>
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <IconCopy size={14} />
        </button>
        <button
          onClick={onTrash}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  )
}
