'use client'

import type { Diagram, Folder } from '@/types/library'
import DiagramCard from './DiagramCard'
import EmptyState from './EmptyState'

interface Props {
  diagrams: Diagram[]
  folders: Folder[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onTrash: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, name: string) => void
  onMove: (id: string, folderId: string | null) => void
  emptyVariant?: 'empty-library' | 'empty-starred' | 'empty-folder' | 'no-results'
}

export default function DiagramGrid({
  diagrams,
  folders,
  selectedIds,
  onToggleSelect,
  onStar,
  onTrash,
  onDuplicate,
  onRename,
  onMove,
  emptyVariant = 'empty-library',
}: Props) {
  if (diagrams.length === 0) {
    return <EmptyState variant={emptyVariant} />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {diagrams.map(diagram => (
        <DiagramCard
          key={diagram.id}
          diagram={diagram}
          folders={folders}
          selected={selectedIds.has(diagram.id)}
          onToggleSelect={() => onToggleSelect(diagram.id)}
          onStar={starred => onStar(diagram.id, starred)}
          onTrash={() => onTrash(diagram.id)}
          onDuplicate={() => onDuplicate(diagram.id)}
          onRename={name => onRename(diagram.id, name)}
          onMove={folderId => onMove(diagram.id, folderId)}
        />
      ))}
    </div>
  )
}
