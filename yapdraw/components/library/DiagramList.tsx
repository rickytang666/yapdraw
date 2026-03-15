'use client'

import type { Diagram, Folder } from '@/types/library'
import DiagramRow from './DiagramRow'
import EmptyState from './EmptyState'

interface Props {
  diagrams: Diagram[]
  folders: Folder[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onDuplicate: (id: string) => void
  onTrash: (id: string) => void
}

export default function DiagramList({
  diagrams,
  folders,
  selectedIds,
  onToggleSelect,
  onOpen,
  onStar,
  onDuplicate,
  onTrash,
}: Props) {
  if (diagrams.length === 0) {
    return <EmptyState variant="empty-library" />
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Column headers */}
      <div
        className="flex items-center gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{
          color: 'var(--text-tertiary)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="w-4 shrink-0" />
        <div className="w-10 shrink-0" />
        <span className="flex-1">Name</span>
        <span className="shrink-0 w-24 text-right hidden sm:block">Updated</span>
        <span className="shrink-0 w-28 text-right hidden md:block">Folder</span>
        <div className="shrink-0 w-20" />
      </div>

      {diagrams.map(diagram => (
        <DiagramRow
          key={diagram.id}
          diagram={diagram}
          folders={folders}
          selected={selectedIds.has(diagram.id)}
          onSelect={() => onToggleSelect(diagram.id)}
          onOpen={() => onOpen(diagram.id)}
          onStar={starred => onStar(diagram.id, starred)}
          onDuplicate={() => onDuplicate(diagram.id)}
          onTrash={() => onTrash(diagram.id)}
        />
      ))}
    </div>
  )
}
