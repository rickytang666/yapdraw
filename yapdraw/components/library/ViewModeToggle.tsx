'use client'

import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import type { ViewMode } from '@/types/library'

interface Props {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onToggle }: Props) {
  return (
    <div className="flex items-center rounded-md border border-zinc-700 overflow-hidden">
      <button
        onClick={() => onToggle('grid')}
        className={`p-1.5 transition-colors ${
          viewMode === 'grid'
            ? 'bg-zinc-700 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        }`}
        title="Grid view"
      >
        <IconLayoutGrid size={15} />
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`p-1.5 transition-colors ${
          viewMode === 'list'
            ? 'bg-zinc-700 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        }`}
        title="List view"
      >
        <IconList size={15} />
      </button>
    </div>
  )
}
