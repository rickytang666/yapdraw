'use client'

import {
  IconLayoutGrid,
  IconStar,
  IconClock,
  IconTrash,
  IconFolderPlus,
} from '@tabler/icons-react'
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

const FIXED_SECTIONS: { id: SidebarSection; label: string; icon: React.ReactNode }[] = [
  { id: 'all',     label: 'All Diagrams', icon: <IconLayoutGrid size={16} /> },
  { id: 'starred', label: 'Starred',      icon: <IconStar size={16} /> },
  { id: 'recent',  label: 'Recent',       icon: <IconClock size={16} /> },
  { id: 'trash',   label: 'Trash',        icon: <IconTrash size={16} /> },
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
  return (
    <aside className="w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-white tracking-tight">YapDraw</h1>
      </div>

      {/* Fixed sections */}
      <nav className="flex flex-col gap-0.5 px-2">
        {FIXED_SECTIONS.map(({ id, label, icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => onSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left w-full ${
                isActive
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
              {id === 'trash' && trashedCount > 0 && (
                <span className="ml-auto text-xs text-zinc-500">{trashedCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Folders section */}
      <div className="mt-4 px-2 flex-1">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Folders
          </span>
          <button
            onClick={onCreateFolder}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
            title="New folder"
          >
            <IconFolderPlus size={14} />
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="px-2 py-1 text-xs text-zinc-600 italic">No folders yet</p>
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
    </aside>
  )
}
