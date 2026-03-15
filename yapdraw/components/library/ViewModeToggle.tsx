'use client'

import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import type { ViewMode } from '@/types/library'

interface Props {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onToggle }: Props) {
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-tertiary)' }}
    >
      <button
        onClick={() => onToggle('grid')}
        className="p-1.5 transition-colors rounded-lg m-0.5"
        style={{
          background: viewMode === 'grid' ? 'var(--bg-secondary)' : 'transparent',
          color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-tertiary)',
          boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <IconLayoutGrid size={15} />
      </button>
      <button
        onClick={() => onToggle('list')}
        className="p-1.5 transition-colors rounded-lg m-0.5"
        style={{
          background: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent',
          color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
          boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <IconList size={15} />
      </button>
    </div>
  )
}
