'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconSearch, IconUpload } from '@tabler/icons-react'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useLibrary } from '@/hooks/useLibrary'
import { useFolders } from '@/hooks/useFolders'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { migrateFromLocalStorage } from '@/lib/migrate'
import { importExcalidrawFile } from '@/lib/import'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram, DiagramType, DiagramTemplate, FolderColor } from '@/types/library'
import Sidebar from './Sidebar'
import DiagramGrid from './DiagramGrid'
import DiagramList from './DiagramList'
import TrashView from './TrashView'
import NewDiagramModal from './NewDiagramModal'
import NewFolderModal from './NewFolderModal'
import RenameFolderModal from './RenameFolderModal'
import BulkActionBar from './BulkActionBar'
import SortDropdown from './SortDropdown'
import ViewModeToggle from './ViewModeToggle'
import EmptyState from './EmptyState'

export default function LibraryView() {
  const router = useRouter()
  const lib = useLibrary()
  const folderHook = useFolders()

  const [showNewModal, setShowNewModal] = useState(false)
  const [folderModalParentId, setFolderModalParentId] = useState<string | undefined>(undefined)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null)
  const [overFolderId, setOverFolderId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Run migration once on first load
  useEffect(() => {
    migrateFromLocalStorage()
    lib.purgeExpiredTrash()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    '/': () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    'mod+k': () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    'mod+n': () => {
      if (!isTrash) setShowNewModal(true)
    },
    'escape': () => {
      lib.clearSelection()
    },
  })

  const isTrash = lib.state.activeSection === 'trash'

  async function handleCreateDiagram(name: string, diagramType: DiagramType, template?: DiagramTemplate) {
    setShowNewModal(false)
    const id = nanoid()
    const now = Date.now()
    const folderId = lib.state.activeSection.startsWith('folder:')
      ? lib.state.activeSection.slice(7)
      : null

    const elements = template?.elements ?? []

    const diagram: Diagram = {
      id,
      name,
      folderId,
      elements,
      transcript: '',
      diagramType,
      thumbnail: null, files: {}, graph: null,
      tags: [],
      starred: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      trashedAt: null,
      metadata: {
        elementCount: elements.length,
        arrowCount: 0,
        colorPalette: [],
        generatedVia: template ? 'template' : 'manual',
      },
    }

    await db.diagrams.add(diagram)
    router.push(`/d/${id}`)
  }

  function handleCreateFolder(parentId?: string) {
    setFolderModalParentId(parentId)
    setShowFolderModal(true)
  }

  async function handleConfirmFolder(name: string, color: FolderColor | null) {
    setShowFolderModal(false)
    try {
      const id = await folderHook.createFolder(name, folderModalParentId)
      if (color) await folderHook.setFolderColor(id, color)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function handleRenameFolder(id: string) {
    const folder = folderHook.folders.find(f => f.id === id)
    if (!folder) return
    setRenameFolderId(id)
  }

  async function handleConfirmRenameFolder(name: string) {
    if (!renameFolderId) return
    await folderHook.renameFolder(renameFolderId, name)
    setRenameFolderId(null)
  }

  async function handleDeleteFolder(id: string) {
    const folder = folderHook.folders.find(f => f.id === id)
    if (!folder) return
    const confirmed = window.confirm(
      `Delete folder "${folder.name}"? All diagrams inside will be moved to root.`
    )
    if (!confirmed) return
    await folderHook.deleteFolder(id)
    if (lib.state.activeSection === `folder:${id}`) {
      lib.setSection('all')
    }
  }

  // Import handler
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset the input so the same file can be imported again
    e.target.value = ''
    try {
      const newId = await importExcalidrawFile(file)
      router.push(`/d/${newId}`)
    } catch (err) {
      console.error('Import failed:', err)
      alert('Failed to import file. Make sure it is a valid .excalidraw file.')
    }
  }

  // DnD handlers
  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (over && typeof over.id === 'string' && over.id.startsWith('folder:')) {
      setOverFolderId(over.id.slice(7))
    } else {
      setOverFolderId(null)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setOverFolderId(null)
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    if (overId.startsWith('folder:')) {
      const folderId = overId.slice(7)
      await lib.moveDiagram(draggedId, folderId)
    }
  }

  function sectionLabel(): string {
    switch (lib.state.activeSection) {
      case 'all': return 'All Diagrams'
      case 'starred': return 'Starred'
      case 'recent': return 'Recent'
      case 'trash': return 'Trash'
      default:
        if (lib.state.activeSection.startsWith('folder:')) {
          const fid = lib.state.activeSection.slice(7)
          const folder = folderHook.folders.find(f => f.id === fid)
          return folder?.name || 'Folder'
        }
        return 'Library'
    }
  }

  function getEmptyVariant(): 'empty-library' | 'empty-folder' | 'no-results' {
    if (lib.state.searchQuery.trim()) return 'no-results'
    if (lib.state.activeSection.startsWith('folder:')) return 'empty-folder'
    return 'empty-library'
  }

  const selectedIds = lib.state.selectedIds
  const hasBulkSelection = selectedIds.size > 0

  return (
    <DndContext
      sensors={sensors}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA]">
        {showNewModal && (
          <NewDiagramModal
            onConfirm={handleCreateDiagram}
            onCancel={() => setShowNewModal(false)}
          />
        )}
        {showFolderModal && (
          <NewFolderModal
            parentName={
              folderModalParentId
                ? folderHook.folders.find(f => f.id === folderModalParentId)?.name
                : undefined
            }
            onConfirm={handleConfirmFolder}
            onCancel={() => setShowFolderModal(false)}
          />
        )}

        {renameFolderId && (
          <RenameFolderModal
            folder={{
              id: renameFolderId,
              name: folderHook.folders.find(f => f.id === renameFolderId)?.name || 'Folder',
            }}
            onConfirm={handleConfirmRenameFolder}
            onCancel={() => setRenameFolderId(null)}
          />
        )}

        {/* Hidden import file input */}
        <input
          ref={importInputRef}
          type="file"
          accept=".excalidraw"
          className="hidden"
          onChange={handleImportFile}
        />

        <Sidebar
          activeSection={lib.state.activeSection}
          trashedCount={lib.trashedCount}
          onSection={lib.setSection}
          folders={folderHook.tree}
          overFolderId={overFolderId}
          onCreateFolder={() => handleCreateFolder()}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onAddSubfolder={parentId => handleCreateFolder(parentId)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-3 h-14 px-6 border-b border-[#F1F5F9] bg-white shrink-0">
            <h2 className="text-[#0F172A] font-semibold text-base shrink-0">{sectionLabel()}</h2>

            {/* Search */}
            {!isTrash && (
              <div className="flex items-center gap-2 ml-4 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 flex-1 max-w-xs">
                <IconSearch size={14} className="text-[#94A3B8] shrink-0" />
                <input
                  ref={searchRef}
                  className="bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none flex-1"
                  placeholder="Search diagrams…"
                  value={lib.state.searchQuery}
                  onChange={e => lib.setSearch(e.target.value)}
                />
                {!lib.state.searchQuery && (
                  <kbd className="hidden sm:flex items-center gap-0.5 text-[#94A3B8] text-xs font-sans pointer-events-none">
                    <span className="text-[11px]">⌘</span>K
                  </kbd>
                )}
              </div>
            )}

            <div className="flex-1" />

            {/* Sort + View toggles */}
            {!isTrash && (
              <div className="flex items-center gap-2">
                <SortDropdown
                  sortField={lib.state.sortField}
                  sortDirection={lib.state.sortDirection}
                  onSort={lib.setSort}
                />
                <ViewModeToggle
                  viewMode={lib.state.viewMode}
                  onToggle={lib.setViewMode}
                />
              </div>
            )}

            {/* Import button */}
            {!isTrash && (
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#D1D5DB] hover:border-[#94A3B8] text-sm rounded-md transition-colors"
                onClick={() => importInputRef.current?.click()}
                title="Import .excalidraw file"
              >
                <IconUpload size={15} />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {/* New Diagram button */}
            {!isTrash && (
              <button
                className="flex items-center gap-2 px-3 py-1.5 bg-[#5B57D1] hover:bg-[#4F4BC4] text-white text-sm font-medium rounded-md transition-colors"
                onClick={() => setShowNewModal(true)}
              >
                <IconPlus size={16} />
                New Diagram
              </button>
            )}
          </header>

          {/* Content */}
          {isTrash ? (
            <TrashView
              diagrams={lib.diagrams}
              onRestore={lib.restoreDiagram}
              onDelete={lib.permanentlyDelete}
              onEmptyTrash={lib.emptyTrash}
            />
          ) : lib.diagrams.length === 0 ? (
            <EmptyState variant={getEmptyVariant()} />
          ) : lib.state.viewMode === 'list' ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <DiagramList
                diagrams={lib.diagrams}
                folders={lib.folders}
                selectedIds={selectedIds}
                onToggleSelect={lib.toggleSelect}
                onOpen={id => router.push(`/d/${id}`)}
                onStar={lib.starDiagram}
                onDuplicate={async id => {
                  const newId = await lib.duplicateDiagram(id)
                  router.push(`/d/${newId}`)
                }}
                onTrash={lib.trashDiagram}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <DiagramGrid
                diagrams={lib.diagrams}
                folders={lib.folders}
                selectedIds={selectedIds}
                onToggleSelect={lib.toggleSelect}
                onStar={lib.starDiagram}
                onTrash={lib.trashDiagram}
                onDuplicate={async id => {
                  const newId = await lib.duplicateDiagram(id)
                  router.push(`/d/${newId}`)
                }}
                onRename={lib.renameDiagram}
                onMove={lib.moveDiagram}
                emptyVariant={getEmptyVariant()}
              />
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {hasBulkSelection && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            folders={lib.folders}
            diagrams={lib.diagrams}
            selectedIds={selectedIds}
            onStar={() => lib.bulkStar(Array.from(selectedIds), true)}
            onUnstar={() => lib.bulkStar(Array.from(selectedIds), false)}
            onMove={folderId => lib.bulkMove(Array.from(selectedIds), folderId)}
            onTrash={() => lib.bulkTrash(Array.from(selectedIds))}
            onClear={lib.clearSelection}
          />
        )}
      </div>
    </DndContext>
  )
}
