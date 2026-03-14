'use client'

import { useState, useRef, useEffect } from 'react'
import {
  IconDotsVertical,
  IconPhoto,
  IconFileExport,
  IconFileCode,
  IconHistory,
  IconCopy,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react'
import { exportAsPNG, exportAsExcalidraw, exportAsJSON } from '@/lib/export'
import type { Diagram } from '@/types/library'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'

interface Props {
  diagram: Diagram
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  onDuplicate: () => void
  onToggleLock: () => void
  onShowHistory: () => void
}

export default function EditorMenu({
  diagram,
  canvasRef,
  onDuplicate,
  onToggleLock,
  onShowHistory,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  async function handleExportPNG() {
    setIsOpen(false)
    try {
      const thumbnail = await canvasRef.current?.exportThumbnail?.()
      if (thumbnail) {
        await exportAsPNG(thumbnail, diagram.name)
      }
    } catch (err) {
      console.error('PNG export failed:', err)
    }
  }

  function handleExportExcalidraw() {
    setIsOpen(false)
    exportAsExcalidraw(diagram)
  }

  function handleExportJSON() {
    setIsOpen(false)
    exportAsJSON(diagram)
  }

  function handleShowHistory() {
    setIsOpen(false)
    onShowHistory()
  }

  function handleDuplicate() {
    setIsOpen(false)
    onDuplicate()
  }

  function handleToggleLock() {
    setIsOpen(false)
    onToggleLock()
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(v => !v)}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
        aria-label="More options"
        aria-expanded={isOpen}
      >
        <IconDotsVertical size={16} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden py-1 z-50"
        >
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
            onClick={handleExportPNG}
          >
            <IconPhoto size={14} className="shrink-0" />
            Export as PNG
          </button>

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
            onClick={handleShowHistory}
          >
            <IconHistory size={14} className="shrink-0" />
            Version History
          </button>

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
            onClick={handleDuplicate}
          >
            <IconCopy size={14} className="shrink-0" />
            Duplicate
          </button>

          <div className="my-1 border-t border-zinc-700" />

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left"
            onClick={handleToggleLock}
          >
            {diagram.locked ? (
              <>
                <IconLockOpen size={14} className="shrink-0 text-yellow-400" />
                <span>Unlock Diagram</span>
              </>
            ) : (
              <>
                <IconLock size={14} className="shrink-0" />
                <span>Lock Diagram</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
