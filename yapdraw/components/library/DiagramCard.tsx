'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { IconStar, IconStarFilled, IconTrash, IconCopy } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { Diagram, Folder } from '@/types/library'
import DiagramCardContextMenu from './DiagramCardContextMenu'

interface Props {
  diagram: Diagram
  folders: Folder[]
  selected?: boolean
  onStar: (starred: boolean) => void
  onTrash: () => void
  onDuplicate: () => void
  onRename: (name: string) => void
  onMove: (folderId: string | null) => void
  onToggleSelect?: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function DiagramCard({
  diagram,
  folders,
  selected,
  onStar,
  onTrash,
  onDuplicate,
  onRename,
  onMove,
  onToggleSelect,
}: Props) {
  const router = useRouter()
  const [hasMounted, setHasMounted] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(diagram.name)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: diagram.id,
    data: { type: 'diagram', diagramId: diagram.id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function handleOpen() {
    router.push(`/d/${diagram.id}`)
  }

  function handleRenameStart() {
    setIsRenaming(true)
    setRenameValue(diagram.name)
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  function handleRenameCommit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== diagram.name) {
      onRename(trimmed)
    }
    setIsRenaming(false)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleRenameCommit()
    if (e.key === 'Escape') setIsRenaming(false)
  }

  const visibleTags = diagram.tags.slice(0, 2)

  return (
    <>
      <motion.div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onContextMenu={handleContextMenu}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`group relative rounded-2xl cursor-pointer overflow-hidden flex flex-col transition-shadow duration-200 ${
          isDragging ? 'shadow-xl' : ''
        }`}
        style={{
          ...style,
          background: 'var(--bg-secondary)',
          border: selected
            ? '2px solid var(--accent)'
            : '1px solid var(--border)',
          boxShadow: selected
            ? '0 0 0 3px var(--accent-subtle)'
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={e => {
          if (isRenaming) return
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            e.preventDefault()
            onToggleSelect?.()
          } else {
            handleOpen()
          }
        }}
      >
        {/* Thumbnail */}
        <div
          className="aspect-[16/10] flex items-center justify-center overflow-hidden shrink-0"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          {diagram.thumbnail ? (
            <img
              src={diagram.thumbnail}
              alt={diagram.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No preview
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1.5">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="text-sm font-medium rounded-lg px-2 py-1 outline-none w-full"
              style={{
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={handleRenameKeyDown}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {diagram.name}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {hasMounted ? formatDate(diagram.updatedAt) : ''}
          </p>

          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {visibleTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] leading-tight"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                  {tag}
                </span>
              ))}
              {diagram.tags.length > 2 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] leading-tight"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  +{diagram.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Star — always visible, muted unless starred */}
        <div
          className="absolute top-3 right-3"
          onClick={e => { e.stopPropagation(); onStar(!diagram.starred) }}
          onPointerDown={e => e.stopPropagation()}
        >
          {diagram.starred ? (
            <IconStarFilled size={16} style={{ color: 'var(--star)' }} />
          ) : (
            <IconStar
              size={16}
              className="opacity-0 group-hover:opacity-60 transition-opacity"
              style={{ color: 'var(--text-tertiary)' }}
            />
          )}
        </div>

        {/* Hover actions */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(transparent, var(--bg-secondary))' }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <button
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onDuplicate}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <IconCopy size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onTrash}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--danger-subtle)'
              e.currentTarget.style.color = 'var(--danger)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <IconTrash size={14} />
          </button>
        </div>

        {/* Selection checkbox */}
        {onToggleSelect && (
          <div
            className={`absolute top-3 left-3 transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={e => { e.stopPropagation(); onToggleSelect() }}
            onPointerDown={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </motion.div>

      {contextMenu && (
        <DiagramCardContextMenu
          diagram={diagram}
          folders={folders}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onOpen={handleOpen}
          onRename={handleRenameStart}
          onDuplicate={onDuplicate}
          onStar={() => onStar(!diagram.starred)}
          onMove={onMove}
          onTrash={onTrash}
        />
      )}
    </>
  )
}
