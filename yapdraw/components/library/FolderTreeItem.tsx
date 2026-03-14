'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  IconFolder,
  IconFolderOpen,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react'
import type { FolderNode } from '@/hooks/useFolders'
import type { FolderColor, SidebarSection } from '@/types/library'

const COLOR_CLASS: Record<FolderColor, string> = {
  slate:  'text-slate-400',
  red:    'text-red-400',
  orange: 'text-orange-400',
  amber:  'text-amber-400',
  green:  'text-green-400',
  teal:   'text-teal-400',
  blue:   'text-blue-400',
  purple: 'text-purple-400',
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
  const indentPx = folder.depth * 12

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
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm cursor-pointer select-none transition-colors ${
          isOver
            ? 'bg-blue-600/30 border border-blue-500/50'
            : isActive
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        style={{ paddingLeft: `${8 + indentPx}px` }}
      >
        {/* Chevron / spacer */}
        <span className="shrink-0 w-4 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={handleChevronClick}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </button>
          ) : null}
        </span>

        {/* Folder icon */}
        {isActive || isOver ? (
          <IconFolderOpen
            size={15}
            className={`shrink-0 ${folder.color ? COLOR_CLASS[folder.color] : 'text-blue-400'}`}
          />
        ) : (
          <IconFolder
            size={15}
            className={`shrink-0 ${folder.color ? COLOR_CLASS[folder.color] : 'text-zinc-400'}`}
          />
        )}

        {/* Name */}
        <span className="flex-1 truncate leading-tight">{folder.name}</span>

        {/* Diagram count */}
        {folder.diagramCount > 0 && (
          <span className="ml-auto text-xs text-zinc-500 tabular-nums shrink-0">
            {folder.diagramCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
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
        </div>
      )}
    </div>
  )
}
