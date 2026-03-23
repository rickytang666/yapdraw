'use client'

import { useRouter } from 'next/navigation'
import type { Diagram, Folder, ViewMode, SidebarSection } from '@/types/library'
import DiagramGrid from './DiagramGrid'
import DiagramList from './DiagramList'
import TrashView from './TrashView'
import EmptyState from './EmptyState'

interface LibraryContentProps {
  isTrash: boolean
  diagrams: Diagram[]
  folders: Folder[]
  selectedIds: Set<string>
  viewMode: ViewMode
  searchQuery: string
  activeSection: SidebarSection
  trashedCount: number
  folderTree: { id: string; name: string }[]
  onToggleSelect: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onTrash: (id: string) => void
  onDuplicate: (id: string) => Promise<string>
  onRename: (id: string, name: string) => void
  onMove: (id: string, folderId: string | null) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onEmptyTrash: () => void
  onSetSection: (section: SidebarSection) => void
  onCreateDiagram: () => void
}

export default function LibraryContent({
  isTrash,
  diagrams,
  folders,
  selectedIds,
  viewMode,
  searchQuery,
  activeSection,
  trashedCount,
  folderTree,
  onToggleSelect,
  onStar,
  onTrash,
  onDuplicate,
  onRename,
  onMove,
  onRestore,
  onDelete,
  onEmptyTrash,
  onSetSection,
  onCreateDiagram,
}: LibraryContentProps) {
  const router = useRouter()

  function getEmptyVariant(): 'empty-library' | 'empty-folder' | 'no-results' | 'empty-starred' {
    if (searchQuery.trim()) return 'no-results'
    if (activeSection === 'starred') return 'empty-starred'
    if (activeSection.startsWith('folder:')) return 'empty-folder'
    return 'empty-library'
  }

  async function handleDuplicate(id: string) {
    const newId = await onDuplicate(id)
    router.push(`/d/${newId}`)
  }

  return (
    <>
      {/* mobile section pills */}
      <div className="md:hidden flex overflow-x-auto shrink-0 border-b border-border-subtle bg-white px-3 py-2 gap-1.5">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'starred' as const, label: 'Starred' },
            { id: 'trash' as const, label: `Trash${trashedCount > 0 ? ` (${trashedCount})` : ''}` },
          ] as { id: 'all' | 'starred' | 'trash'; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSetSection(id)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
              activeSection === id
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        {folderTree.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSetSection(`folder:${folder.id}`)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
              activeSection === `folder:${folder.id}`
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-foreground'
            }`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      {/* content */}
      {isTrash ? (
        <TrashView
          diagrams={diagrams}
          onRestore={onRestore}
          onDelete={onDelete}
          onEmptyTrash={onEmptyTrash}
        />
      ) : diagrams.length === 0 ? (
        <EmptyState variant={getEmptyVariant()} onCreateDiagram={onCreateDiagram} />
      ) : viewMode === 'list' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <DiagramList
            diagrams={diagrams}
            folders={folders}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onOpen={id => router.push(`/d/${id}`)}
            onStar={onStar}
            onDuplicate={handleDuplicate}
            onTrash={onTrash}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <DiagramGrid
            diagrams={diagrams}
            folders={folders}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onStar={onStar}
            onTrash={onTrash}
            onDuplicate={handleDuplicate}
            onRename={onRename}
            onMove={onMove}
            emptyVariant={getEmptyVariant()}
          />
        </div>
      )}
    </>
  )
}
