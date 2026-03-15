'use client'

import { useState } from 'react'
import {
  IconLayoutGrid,
  IconStar,
  IconClock,
  IconTrash,
  IconFolderPlus,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SidebarSection } from '@/types/library'
import type { FolderNode } from '@/hooks/useFolders'
import FolderTree from './FolderTree'

interface Props {
  activeSection: SidebarSection
  trashedCount: number
  onSection: (section: SidebarSection) => void
  folders: FolderNode[]
  overFolderId: string | null
  onCreateFolder: () => void
  onRenameFolder: (id: string) => void
  onDeleteFolder: (id: string) => void
  onAddSubfolder: (parentId: string) => void
}

const NAV_SECTIONS: { id: SidebarSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'all',     label: 'All Diagrams', icon: IconLayoutGrid },
  { id: 'starred', label: 'Starred',      icon: IconStar },
  { id: 'recent',  label: 'Recent',       icon: IconClock },
]

export default function Sidebar({
  activeSection,
  trashedCount,
  onSection,
  folders,
  overFolderId,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddSubfolder,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="shrink-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between h-14 px-3 shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-base font-bold tracking-tight pl-1"
              style={{ color: 'var(--text-primary)' }}
            >
              YapDraw
            </motion.h1>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <IconChevronsRight size={16} /> : <IconChevronsLeft size={16} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2 mt-1">
        {NAV_SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => onSection(id)}
              className="flex items-center gap-2.5 py-2 rounded-xl text-sm transition-all text-left w-full relative"
              style={{
                padding: collapsed ? '8px 0' : '8px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                  style={{ height: '60%', background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Folders section */}
      {!collapsed && (
        <div className="mt-6 px-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-3 mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Folders
            </span>
            <button
              onClick={onCreateFolder}
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-tertiary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <IconFolderPlus size={14} />
            </button>
          </div>

          {folders.length === 0 ? (
            <p className="px-3 py-1 text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
              No folders yet
            </p>
          ) : (
            <FolderTree
              folders={folders}
              activeSection={activeSection}
              overFolderId={overFolderId}
              onSection={onSection}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
              onAddSubfolder={onAddSubfolder}
            />
          )}
        </div>
      )}

      {/* Trash at bottom */}
      <div className="px-2 pb-3 mt-auto shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onSection('trash')}
          className="flex items-center gap-2.5 py-2 mt-2 rounded-xl text-sm transition-all text-left w-full"
          style={{
            padding: collapsed ? '8px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: activeSection === 'trash' ? 'var(--danger-subtle)' : 'transparent',
            color: activeSection === 'trash' ? 'var(--danger)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'trash' ? 600 : 400,
          }}
          onMouseEnter={e => {
            if (activeSection !== 'trash') e.currentTarget.style.background = 'var(--bg-tertiary)'
          }}
          onMouseLeave={e => {
            if (activeSection !== 'trash') e.currentTarget.style.background = 'transparent'
          }}
        >
          <IconTrash size={18} />
          {!collapsed && (
            <>
              <span>Trash</span>
              {trashedCount > 0 && (
                <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {trashedCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
