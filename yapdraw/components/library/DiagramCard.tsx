'use client'

import { useRouter } from 'next/navigation'
import { IconStar, IconStarFilled, IconTrash, IconCopy } from '@tabler/icons-react'
import type { Diagram } from '@/types/library'

interface Props {
  diagram: Diagram
  onStar: (starred: boolean) => void
  onTrash: () => void
  onDuplicate: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DiagramCard({ diagram, onStar, onTrash, onDuplicate }: Props) {
  const router = useRouter()

  return (
    <div
      className="group relative bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer overflow-hidden flex flex-col"
      onClick={() => router.push(`/d/${diagram.id}`)}
    >
      {/* Thumbnail */}
      <div className="h-36 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
        {diagram.thumbnail ? (
          <img
            src={diagram.thumbnail}
            alt={diagram.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-zinc-600 text-xs">No preview</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-medium text-white truncate">{diagram.name}</p>
        <p className="text-xs text-zinc-500">{formatDate(diagram.updatedAt)}</p>
        <p className="text-xs text-zinc-600 capitalize">{diagram.diagramType}</p>
      </div>

      {/* Action buttons — visible on hover */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="p-1 rounded bg-zinc-800/80 text-zinc-400 hover:text-yellow-400 transition-colors"
          onClick={() => onStar(!diagram.starred)}
          title={diagram.starred ? 'Unstar' : 'Star'}
        >
          {diagram.starred
            ? <IconStarFilled size={14} className="text-yellow-400" />
            : <IconStar size={14} />
          }
        </button>
        <button
          className="p-1 rounded bg-zinc-800/80 text-zinc-400 hover:text-blue-400 transition-colors"
          onClick={onDuplicate}
          title="Duplicate"
        >
          <IconCopy size={14} />
        </button>
        <button
          className="p-1 rounded bg-zinc-800/80 text-zinc-400 hover:text-red-400 transition-colors"
          onClick={onTrash}
          title="Move to trash"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {/* Starred badge */}
      {diagram.starred && (
        <div className="absolute top-2 left-2">
          <IconStarFilled size={12} className="text-yellow-400" />
        </div>
      )}
    </div>
  )
}
