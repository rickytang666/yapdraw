'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { useLibrary } from '@/hooks/useLibrary'
import { migrateFromLocalStorage } from '@/lib/migrate'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram, DiagramType } from '@/types/library'
import Sidebar from './Sidebar'
import DiagramGrid from './DiagramGrid'
import TrashView from './TrashView'
import NewDiagramModal from './NewDiagramModal'

export default function LibraryView() {
  const router = useRouter()
  const lib = useLibrary()
  const [showNewModal, setShowNewModal] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Run migration once on first load
  useEffect(() => {
    migrateFromLocalStorage()
    lib.purgeExpiredTrash()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isTrash = lib.state.activeSection === 'trash'

  async function handleCreateDiagram(name: string, diagramType: DiagramType) {
    setShowNewModal(false)
    const id = nanoid()
    const now = Date.now()
    const folderId = lib.state.activeSection.startsWith('folder:')
      ? lib.state.activeSection.slice(7)
      : null

    const diagram: Diagram = {
      id,
      name,
      folderId,
      elements: [],
      transcript: '',
      diagramType,
      thumbnail: null,
      tags: [],
      starred: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      trashedAt: null,
      metadata: {
        elementCount: 0,
        arrowCount: 0,
        colorPalette: [],
        generatedVia: 'manual',
      },
    }

    await db.diagrams.add(diagram)
    router.push(`/d/${id}`)
  }

  function sectionLabel(): string {
    switch (lib.state.activeSection) {
      case 'all': return 'All Diagrams'
      case 'starred': return 'Starred'
      case 'recent': return 'Recent'
      case 'trash': return 'Trash'
      default:
        if (lib.state.activeSection.startsWith('folder:')) return 'Folder'
        return 'Library'
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-900">
      {showNewModal && (
        <NewDiagramModal
          onConfirm={handleCreateDiagram}
          onCancel={() => setShowNewModal(false)}
        />
      )}
      <Sidebar
        activeSection={lib.state.activeSection}
        trashedCount={lib.trashedCount}
        onSection={lib.setSection}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 h-14 px-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-white font-semibold text-base">{sectionLabel()}</h2>

          {/* Search */}
          {!isTrash && (
            <div className="flex items-center gap-2 ml-4 bg-zinc-800 rounded-md px-3 py-1.5 flex-1 max-w-xs">
              <IconSearch size={14} className="text-zinc-500" />
              <input
                ref={searchRef}
                className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none flex-1"
                placeholder="Search diagrams…"
                value={lib.state.searchQuery}
                onChange={e => lib.setSearch(e.target.value)}
              />
              {!lib.state.searchQuery && (
                <kbd className="hidden sm:flex items-center gap-0.5 text-zinc-500 text-xs font-sans pointer-events-none">
                  <span className="text-[11px]">⌘</span>K
                </kbd>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* New Diagram button */}
          {!isTrash && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
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
        ) : (
          <div className="flex-1 overflow-y-auto">
            <DiagramGrid
              diagrams={lib.diagrams}
              onStar={lib.starDiagram}
              onTrash={lib.trashDiagram}
              onDuplicate={async id => {
                const newId = await lib.duplicateDiagram(id)
                router.push(`/d/${newId}`)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
