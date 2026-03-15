'use client'

import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import type { ViewMode } from '@/types/library'

interface Props {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onToggle }: Props) {
  return (
    <div className="flex items-center rounded-md border border-[#D1D5DB] overflow-hidden">
      <button
        onClick={() => onToggle('grid')}
        className={`p-1.5 transition-colors ${
          viewMode === 'grid'
            ? 'bg-[#5B57D1]/15 text-[#5B57D1]'
            : 'bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
        }`}
        title="Grid view"
      >
        <IconLayoutGrid size={15} />
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`p-1.5 transition-colors ${
          viewMode === 'list'
            ? 'bg-[#5B57D1]/15 text-[#5B57D1]'
            : 'bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
        }`}
        title="List view"
      >
        <IconList size={15} />
      </button>
    </div>
  )
}
