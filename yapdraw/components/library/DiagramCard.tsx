'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { IconStar, IconStarFilled, IconTrash, IconCopy } from '@tabler/icons-react'
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
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onContextMenu={handleContextMenu}
        className={`group relative bg-white rounded-lg border transition-colors cursor-pointer overflow-hidden flex flex-col ${
          selected
            ? 'border-[#5B57D1] ring-1 ring-[#5B57D1]'
            : 'border-[#E5E7EB] hover:border-[#94A3B8]'
        } ${isDragging ? 'shadow-2xl' : ''}`}
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
        <div className="h-36 bg-[#FAFAFA] flex items-center justify-center overflow-hidden shrink-0">
          {diagram.thumbnail ? (
            <img
              src={diagram.thumbnail}
              alt={diagram.name}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <span className="text-[#94A3B8] text-xs">No preview</span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="text-sm font-medium text-[#0F172A] bg-[#F1F5F9] border border-[#D1D5DB] rounded px-1.5 py-0.5 outline-none w-full"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={handleRenameKeyDown}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-medium text-[#0F172A] truncate">{diagram.name}</p>
          )}
          <p className="text-xs text-[#64748B]">{hasMounted ? formatDate(diagram.updatedAt) : ''}</p>
          <p className="text-xs text-[#94A3B8] capitalize">{diagram.diagramType}</p>

          {/* Tag pills */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {visibleTags.map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] leading-tight"
                >
                  {tag}
                </span>
              ))}
              {diagram.tags.length > 2 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#94A3B8] text-[10px] leading-tight">
                  +{diagram.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <button
            className="p-1 rounded bg-white/90 shadow-sm text-[#64748B] hover:text-[#F59E0B] transition-colors"
            onClick={() => onStar(!diagram.starred)}
            title={diagram.starred ? 'Unstar' : 'Star'}
          >
            {diagram.starred
              ? <IconStarFilled size={14} className="text-[#F59E0B]" />
              : <IconStar size={14} />
            }
          </button>
          <button
            className="p-1 rounded bg-white/90 shadow-sm text-[#64748B] hover:text-[#5B57D1] transition-colors"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <IconCopy size={14} />
          </button>
          <button
            className="p-1 rounded bg-white/90 shadow-sm text-[#64748B] hover:text-[#DC2626] transition-colors"
            onClick={onTrash}
            title="Move to trash"
          >
            <IconTrash size={14} />
          </button>
        </div>

        {/* Selection checkbox */}
        {onToggleSelect && (
          <div
            className={`absolute top-2 left-2 transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={e => { e.stopPropagation(); onToggleSelect() }}
            onPointerDown={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded accent-[#5B57D1] cursor-pointer"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </div>

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
