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
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const TYPE_COLORS: Record<string, string> = {
  architecture: 'bg-blue-900/50 text-blue-300',
  flowchart: 'bg-green-900/50 text-green-300',
  sequence: 'bg-purple-900/50 text-purple-300',
  er: 'bg-orange-900/50 text-orange-300',
  freeform: 'bg-zinc-700 text-zinc-300',
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
  const visibleTags = diagram.tags.slice(0, 2)
  const typeColor = TYPE_COLORS[diagram.diagramType] || 'bg-zinc-700 text-zinc-300'

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/60 transition-colors ${
        selected ? 'bg-zinc-800' : ''
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
          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-7 bg-zinc-900 rounded overflow-hidden shrink-0 border border-zinc-700">
        {diagram.thumbnail ? (
          <img
            src={diagram.thumbnail}
            alt={diagram.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-600 text-[8px]">—</span>
          </div>
        )}
      </div>

      {/* Name */}
      <p className="flex-1 text-sm font-medium text-white truncate min-w-0">{diagram.name}</p>

      {/* Type badge */}
      <span className={`shrink-0 px-2 py-0.5 rounded text-xs capitalize ${typeColor}`}>
        {diagram.diagramType}
      </span>

      {/* Updated */}
      <span className="shrink-0 text-xs text-zinc-500 tabular-nums hidden md:inline">
        {hasMounted ? formatDate(diagram.updatedAt) : ''}
      </span>

      {/* Folder */}
      <span className="shrink-0 w-28 text-xs text-zinc-500 truncate text-right hidden md:block">
        {folder ? folder.name : '—'}
      </span>

      {/* Tags */}
      <div className="shrink-0 flex gap-1 hidden lg:flex">
        {visibleTags.map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs"
          >
            {tag}
          </span>
        ))}
        {diagram.tags.length > 2 && (
          <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-500 text-xs">
            +{diagram.tags.length - 2}
          </span>
        )}
      </div>

      {/* Date */}
      <span className="shrink-0 text-xs text-zinc-500 w-28 text-right hidden sm:block">
  {hasMounted ? formatDate(diagram.updatedAt) : ''}
      </span>

      {/* Actions */}
      <div
        className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onStar(!diagram.starred)}
          className="p-1 rounded text-zinc-500 hover:text-yellow-400 transition-colors"
          title={diagram.starred ? 'Unstar' : 'Star'}
        >
          {diagram.starred
            ? <IconStarFilled size={14} className="text-yellow-400" />
            : <IconStar size={14} />
          }
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 rounded text-zinc-500 hover:text-blue-400 transition-colors"
          title="Duplicate"
        >
          <IconCopy size={14} />
        </button>
        <button
          onClick={onTrash}
          className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
          title="Move to trash"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  )
}
