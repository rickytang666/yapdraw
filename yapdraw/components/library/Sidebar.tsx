'use client'

import {
  IconLayoutGrid, IconStar, IconClock, IconTrash,
} from '@tabler/icons-react'
import type { SidebarSection } from '@/types/library'

interface Props {
  activeSection: SidebarSection
  trashedCount: number
  onSection: (section: SidebarSection) => void
}

const FIXED_SECTIONS: { id: SidebarSection; label: string; icon: React.ReactNode }[] = [
  { id: 'all',     label: 'All Diagrams', icon: <IconLayoutGrid size={16} /> },
  { id: 'starred', label: 'Starred',      icon: <IconStar size={16} /> },
  { id: 'recent',  label: 'Recent',       icon: <IconClock size={16} /> },
  { id: 'trash',   label: 'Trash',        icon: <IconTrash size={16} /> },
]

export default function Sidebar({ activeSection, trashedCount, onSection }: Props) {
  return (
    <aside className="w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-white tracking-tight">YapDraw</h1>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {FIXED_SECTIONS.map(({ id, label, icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => onSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left w-full ${
                isActive
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
              {id === 'trash' && trashedCount > 0 && (
                <span className="ml-auto text-xs text-zinc-500">{trashedCount}</span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
