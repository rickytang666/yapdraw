'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  IconChevronRight,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FolderNode } from '@/hooks/useFolders'
import type { FolderColor, SidebarSection } from '@/types/library'

const COLOR_DOT: Record<FolderColor, string> = {
  slate:  '#94a3b8',
  red:    '#f87171',
  orange: '#fb923c',
  amber:  '#fbbf24',
  green:  '#4ade80',
  teal:   '#2dd4bf',
  blue:   '#60a5fa',
  purple: '#a78bfa',
}

interface Props {
  folder: FolderNode
  activeSection: SidebarSection
  overFolderId: string | null
  onSection: (s: SidebarSection) => void
  onContextMenu: (e: React.MouseEvent, folder: FolderNode) => void
}

export default function FolderTreeItem({
  folder,
  activeSection,
  overFolderId,
  onSection,
  onContextMenu,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const { setNodeRef } = useDroppable({ id: `folder:${folder.id}` })

  const isActive = activeSection === `folder:${folder.id}`
  const isOver = overFolderId === folder.id
  const hasChildren = folder.children.length > 0
  const indentPx = folder.depth * 16

  function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded(v => !v)
  }

  return (
    <div>
      <div
        ref={setNodeRef}
        onClick={() => onSection(`folder:${folder.id}`)}
        onContextMenu={e => onContextMenu(e, folder)}
        className="group flex items-center gap-2 py-1.5 rounded-xl text-sm cursor-pointer select-none transition-colors"
        style={{
          paddingLeft: `${12 + indentPx}px`,
          paddingRight: '8px',
          background: isOver
            ? 'var(--accent-subtle)'
            : isActive
            ? 'var(--accent-subtle)'
            : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          fontWeight: isActive ? 600 : 400,
          border: isOver ? '1px dashed var(--accent)' : '1px solid transparent',
        }}
        onMouseEnter={e => {
          if (!isActive && !isOver) e.currentTarget.style.background = 'var(--bg-tertiary)'
        }}
        onMouseLeave={e => {
          if (!isActive && !isOver) e.currentTarget.style.background = 'transparent'
        }}
      >
        {/* Chevron */}
        <span className="shrink-0 w-4 flex items-center justify-center">
          {hasChildren ? (
            <motion.button
              onClick={handleChevronClick}
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              style={{ color: 'var(--text-tertiary)' }}
            >
              <IconChevronRight size={12} />
            </motion.button>
          ) : null}
        </span>

        {/* Color dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: folder.color
              ? COLOR_DOT[folder.color]
              : 'var(--text-tertiary)',
          }}
        />

        {/* Name */}
        <span className="flex-1 truncate leading-tight">{folder.name}</span>

        {/* Count */}
        {folder.diagramCount > 0 && (
          <span className="ml-auto text-xs tabular-nums shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {folder.diagramCount}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {folder.children.map(child => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                activeSection={activeSection}
                overFolderId={overFolderId}
                onSection={onSection}
                onContextMenu={onContextMenu}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
