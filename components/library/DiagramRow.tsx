'use client'

import { useSyncExternalStore } from 'react'
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
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const TYPE_COLORS: Record<string, string> = {
  freeform: 'bg-surface text-subtle',
  'system-architecture': 'bg-blue-50 text-blue-600',
  'operations-flowchart': 'bg-green-50 text-green-600',
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
  const hasMounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const folder = folders.find(f => f.id === diagram.folderId)
  const typeColor = TYPE_COLORS[diagram.diagramType] || 'bg-surface text-subtle'

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle cursor-pointer hover:bg-surface transition-colors ${
        selected ? 'bg-surface' : ''
      }`}
      onClick={onOpen}
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
          className="w-4 h-4 rounded accent-primary cursor-pointer"
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-7 bg-background rounded overflow-hidden shrink-0 border border-border-subtle">
        {diagram.thumbnail ? (
          <img
            src={diagram.thumbnail}
            alt={diagram.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-placeholder text-[8px]">—</span>
          </div>
        )}
      </div>

      {/* Name */}
      <p className="flex-1 text-sm font-medium text-foreground truncate min-w-0">{diagram.name}</p>

      {/* Type badge */}
      <span className={`shrink-0 px-2 py-0.5 rounded text-xs capitalize ${typeColor}`}>
        {diagram.diagramType}
      </span>

      {/* Updated */}
      <span className="shrink-0 text-xs text-placeholder tabular-nums hidden md:inline">
        {hasMounted ? formatDate(diagram.updatedAt) : ''}
      </span>

      {/* Folder */}
      <span className="shrink-0 w-28 text-xs text-placeholder truncate text-right hidden md:block">
        {folder ? folder.name : '—'}
      </span>

      {/* Date */}
      <span className="shrink-0 text-xs text-placeholder w-28 text-right hidden sm:block">
        {hasMounted ? formatDate(diagram.updatedAt) : ''}
      </span>

      {/* Actions */}
      <div
        className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onStar(!diagram.starred)}
          className="p-1 rounded text-placeholder hover:text-yellow-500 transition-colors"
          title={diagram.starred ? 'Unstar' : 'Star'}
        >
          {diagram.starred
            ? <IconStarFilled size={14} className="text-yellow-400" />
            : <IconStar size={14} />
          }
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 rounded text-placeholder hover:text-primary transition-colors"
          title="Duplicate"
        >
          <IconCopy size={14} />
        </button>
        <button
          onClick={onTrash}
          className="p-1 rounded text-placeholder hover:text-red-500 transition-colors"
          title="Move to trash"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  )
}
