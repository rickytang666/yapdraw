'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconExternalLink,
  IconPencil,
  IconCopy,
  IconFolderSymlink,
  IconStarFilled,
  IconStar,
  IconTrash,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileExport,
  IconFileCode,
} from '@tabler/icons-react'
import type { Diagram, Folder } from '@/types/library'
import { exportAsExcalidraw, exportAsJSON } from '@/lib/export'

interface Props {
  diagram: Diagram
  folders: Folder[]
  position: { x: number; y: number }
  onClose: () => void
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onStar: () => void
  onMove: (folderId: string | null) => void
  onTrash: () => void
}

export default function DiagramCardContextMenu({
  diagram,
  folders,
  position,
  onClose,
  onOpen,
  onRename,
  onDuplicate,
  onStar,
  onMove,
  onTrash,
}: Props) {
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Adjust position so menu stays on screen
  const safeX = Math.min(position.x, window.innerWidth - 220)
  const safeY = Math.min(position.y, window.innerHeight - 360)

  function handleItem(fn: () => void) {
    fn()
    onClose()
  }

  function handleExportExcalidraw() {
    onClose()
    exportAsExcalidraw(diagram)
  }

  function handleExportJSON() {
    onClose()
    exportAsJSON(diagram)
  }

  const sorted = [...folders].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden py-1 min-w-[180px]"
        style={{ top: safeY, left: safeX }}
      >
        <div className="px-3 py-1.5 text-xs text-zinc-500 font-medium truncate border-b border-zinc-700 mb-1 max-w-[200px]">
          {diagram.name}
        </div>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onOpen)}
        >
          <IconExternalLink size={14} className="shrink-0" />
          Open
        </button>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onRename)}
        >
          <IconPencil size={14} className="shrink-0" />
          Rename
        </button>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onDuplicate)}
        >
          <IconCopy size={14} className="shrink-0" />
          Duplicate
        </button>

        {/* Move to submenu */}
        <div
          className="relative"
          onMouseEnter={() => setShowMoveSubmenu(true)}
          onMouseLeave={() => setShowMoveSubmenu(false)}
        >
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          >
            <IconFolderSymlink size={14} className="shrink-0" />
            <span className="flex-1">Move to</span>
            <IconChevronRight size={12} className="text-zinc-500" />
          </button>

          {showMoveSubmenu && (
            <div className="absolute left-full top-0 ml-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden py-1 z-10">
              <button
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left ${
                  diagram.folderId === null
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
                onClick={() => handleItem(() => onMove(null))}
              >
                <IconFolderOpen size={14} className="shrink-0 text-zinc-400" />
                Root (no folder)
              </button>
              {sorted.map(folder => (
                <button
                  key={folder.id}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left ${
                    diagram.folderId === folder.id
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                  onClick={() => handleItem(() => onMove(folder.id))}
                >
                  <IconFolder size={14} className="shrink-0 text-zinc-400" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
              {sorted.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-500">No folders.</p>
              )}
            </div>
          )}
        </div>

        {/* Export actions */}
        <div className="my-1 border-t border-zinc-700" />

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={handleExportExcalidraw}
        >
          <IconFileExport size={14} className="shrink-0" />
          Export as .excalidraw
        </button>

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={handleExportJSON}
        >
          <IconFileCode size={14} className="shrink-0" />
          Export as JSON
        </button>

        <div className="my-1 border-t border-zinc-700" />

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
          onClick={() => handleItem(onStar)}
        >
          {diagram.starred ? (
            <>
              <IconStarFilled size={14} className="shrink-0 text-yellow-400" />
              Unstar
            </>
          ) : (
            <>
              <IconStar size={14} className="shrink-0" />
              Star
            </>
          )}
        </button>

        <div className="my-1 border-t border-zinc-700" />

        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors text-left"
          onClick={() => handleItem(onTrash)}
        >
          <IconTrash size={14} className="shrink-0" />
          Move to Trash
        </button>
      </div>
    </>
  )
}
