'use client'

import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import type { ViewMode } from '@/types/library'

interface Props {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onToggle }: Props) {
  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      <button
        onClick={() => onToggle('grid')}
        className={`p-1.5 transition-colors ${
          viewMode === 'grid'
            ? 'bg-primary/15 text-primary'
            : 'bg-white text-subtle hover:bg-surface hover:text-foreground'
        }`}
        title="Grid view"
      >
        <IconLayoutGrid size={15} />
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`p-1.5 transition-colors ${
          viewMode === 'list'
            ? 'bg-primary/15 text-primary'
            : 'bg-white text-subtle hover:bg-surface hover:text-foreground'
        }`}
        title="List view"
      >
        <IconList size={15} />
      </button>
    </div>
  )
}
