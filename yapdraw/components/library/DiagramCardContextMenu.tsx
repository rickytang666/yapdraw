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

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  children,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left rounded-lg mx-1"
        style={{
          color: danger ? 'var(--danger)' : 'var(--text-secondary)',
          width: 'calc(100% - 8px)',
        }}
        onClick={onClick}
        onMouseEnter={e => {
          e.currentTarget.style.background = danger ? 'var(--danger-subtle)' : 'var(--bg-tertiary)'
          e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-primary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)'
        }}
      >
        {icon}
        <span className="flex-1">{label}</span>
        {children}
      </button>
    </div>
  )
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
        className="fixed z-50 rounded-2xl shadow-xl overflow-hidden py-1.5 min-w-[190px]"
        style={{
          top: safeY,
          left: safeX,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <MenuItem
          icon={<IconExternalLink size={14} className="shrink-0" />}
          label="Open"
          onClick={() => handleItem(onOpen)}
        />
        <MenuItem
          icon={<IconPencil size={14} className="shrink-0" />}
          label="Rename"
          onClick={() => handleItem(onRename)}
        />

        <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

        <MenuItem
          icon={<IconCopy size={14} className="shrink-0" />}
          label="Duplicate"
          onClick={() => handleItem(onDuplicate)}
        />

        {/* Move to submenu */}
        <div
          className="relative"
          onMouseEnter={() => setShowMoveSubmenu(true)}
          onMouseLeave={() => setShowMoveSubmenu(false)}
        >
          <MenuItem
            icon={<IconFolderSymlink size={14} className="shrink-0" />}
            label="Move to"
          >
            <IconChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
          </MenuItem>

          {showMoveSubmenu && (
            <div
              className="absolute left-full top-0 ml-1 w-48 rounded-xl shadow-xl overflow-hidden py-1"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left"
                style={{
                  background: diagram.folderId === null ? 'var(--bg-tertiary)' : 'transparent',
                  color: 'var(--text-secondary)',
                }}
                onClick={() => handleItem(() => onMove(null))}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => {
                  e.currentTarget.style.background = diagram.folderId === null ? 'var(--bg-tertiary)' : 'transparent'
                }}
              >
                <IconFolderOpen size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                Root
              </button>
              {sorted.map(folder => (
                <button
                  key={folder.id}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left"
                  style={{
                    background: diagram.folderId === folder.id ? 'var(--bg-tertiary)' : 'transparent',
                    color: 'var(--text-secondary)',
                  }}
                  onClick={() => handleItem(() => onMove(folder.id))}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = diagram.folderId === folder.id ? 'var(--bg-tertiary)' : 'transparent'
                  }}
                >
                  <IconFolder size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
              {sorted.length === 0 && (
                <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>No folders.</p>
              )}
            </div>
          )}
        </div>

        <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

        <MenuItem
          icon={<IconFileExport size={14} className="shrink-0" />}
          label="Export .excalidraw"
          onClick={handleExportExcalidraw}
        />
        <MenuItem
          icon={<IconFileCode size={14} className="shrink-0" />}
          label="Export JSON"
          onClick={handleExportJSON}
        />

        <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

        <MenuItem
          icon={diagram.starred
            ? <IconStarFilled size={14} className="shrink-0" style={{ color: 'var(--star)' }} />
            : <IconStar size={14} className="shrink-0" />
          }
          label={diagram.starred ? 'Unstar' : 'Star'}
          onClick={() => handleItem(onStar)}
        />

        <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

        <MenuItem
          icon={<IconTrash size={14} className="shrink-0" />}
          label="Move to Trash"
          onClick={() => handleItem(onTrash)}
          danger
        />
      </div>
    </>
  )
}
