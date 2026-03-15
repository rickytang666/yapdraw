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
import { motion } from 'framer-motion'
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

  const btnClass = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors"

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl shadow-2xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-sm font-medium pr-2" style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border)' }}>
        {selectedCount} selected
      </span>

      <button onClick={onStar} className={btnClass} style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--star)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <IconStar size={15} />
        <span className="hidden sm:inline">Star</span>
      </button>

      <button onClick={onUnstar} className={btnClass} style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <IconStarOff size={15} />
        <span className="hidden sm:inline">Unstar</span>
      </button>

      <div ref={moveButtonRef} className="relative">
        <button onClick={() => setShowFolderPicker(v => !v)} className={btnClass} style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <IconFolderSymlink size={15} />
          <span className="hidden sm:inline">Move</span>
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

      <button
        onClick={handleExportZip}
        disabled={isExporting}
        className={`${btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <IconPackageExport size={15} />
        <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>

      <button onClick={onTrash} className={btnClass} style={{ color: 'var(--danger)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-subtle)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <IconTrash size={15} />
        <span className="hidden sm:inline">Trash</span>
      </button>

      <div className="w-px h-5 mx-0.5" style={{ background: 'var(--border)' }} />

      <button
        onClick={onClear}
        className="p-1.5 rounded-xl transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
      >
        <IconX size={15} />
      </button>
    </motion.div>
  )
}
