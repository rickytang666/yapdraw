'use client'

import { useRef, useState } from 'react'
import {
  IconStar,
  IconStarOff,
  IconFolderSymlink,
  IconTrash,
  IconX,
  IconPackageExport,
} from '@tabler/icons-react'
import FolderPicker from './FolderPicker'
import { exportBulkAsZip } from '@/lib/export'
import type { Folder, Diagram } from '@/types/library'

interface Props {
  selectedCount: number
  folders: Folder[]
  diagrams: Diagram[]
  selectedIds: Set<string>
  onStar: () => void
  onUnstar: () => void
  onMove: (folderId: string | null) => void
  onTrash: () => void
  onClear: () => void
}

export default function BulkActionBar({
  selectedCount,
  folders,
  diagrams,
  selectedIds,
  onStar,
  onUnstar,
  onMove,
  onTrash,
  onClear,
}: Props) {
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const moveButtonRef = useRef<HTMLDivElement>(null)

  if (selectedCount === 0) return null

  async function handleExportZip() {
    const selected = diagrams.filter(d => selectedIds.has(d.id))
    if (selected.length === 0) return
    setIsExporting(true)
    try {
      await exportBulkAsZip(selected, 'excalidraw')
    } catch (err) {
      console.error('Bulk export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-2 bg-white border border-border rounded-xl shadow-lg shadow-black/10">
      {/* Count */}
      <span className="text-sm text-muted font-medium px-1.5 pr-3 border-r border-border-subtle">
        {selectedCount} selected
      </span>

      {/* Star */}
      <button
        onClick={onStar}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
        title="Star selected"
      >
        <IconStar size={15} />
        <span className="hidden sm:inline">Star</span>
      </button>

      {/* Unstar */}
      <button
        onClick={onUnstar}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
        title="Unstar selected"
      >
        <IconStarOff size={15} />
        <span className="hidden sm:inline">Unstar</span>
      </button>

      {/* Move to folder */}
      <div ref={moveButtonRef} className="relative">
        <button
          onClick={() => setShowFolderPicker(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
          title="Move to folder"
        >
          <IconFolderSymlink size={15} />
          <span className="hidden sm:inline">Move to</span>
        </button>

        {showFolderPicker && (
          <div className="absolute bottom-full mb-2 left-0">
            <FolderPicker
              folders={folders}
              currentFolderId={null}
              onSelect={folderId => { onMove(folderId); setShowFolderPicker(false) }}
              onClose={() => setShowFolderPicker(false)}
            />
          </div>
        )}
      </div>

      {/* Export ZIP */}
      <button
        onClick={handleExportZip}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted hover:bg-surface hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Export selected as ZIP"
      >
        <IconPackageExport size={15} />
        <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export ZIP'}</span>
      </button>

      {/* Trash */}
      <button
        onClick={onTrash}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Move to trash"
      >
        <IconTrash size={15} />
        <span className="hidden sm:inline">Trash</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border-subtle mx-1" />

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="p-1.5 rounded-md text-placeholder hover:bg-surface hover:text-muted transition-colors"
        title="Clear selection"
      >
        <IconX size={15} />
      </button>
    </div>
  )
}
