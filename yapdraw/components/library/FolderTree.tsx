'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import FolderTreeItem from './FolderTreeItem'
import FolderContextMenu from './FolderContextMenu'
import type { FolderNode } from '@/hooks/useFolders'
import type { SidebarSection } from '@/types/library'

interface Props {
  folders: FolderNode[]
  activeSection: SidebarSection
  overFolderId: string | null
  onSection: (s: SidebarSection) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onAddSubfolder: (parentId: string) => void
}

interface ContextMenuState {
  folder: FolderNode
  position: { x: number; y: number }
}

export default function FolderTree({
  folders,
  activeSection,
  overFolderId,
  onSection,
  onRename,
  onDelete,
  onAddSubfolder,
}: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  function handleContextMenu(e: React.MouseEvent, folder: FolderNode) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ folder, position: { x: e.clientX, y: e.clientY } })
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  const allIds = folders.map(f => f.id)

  return (
    <>
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {folders.map(folder => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              activeSection={activeSection}
              overFolderId={overFolderId}
              onSection={onSection}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </SortableContext>

      {contextMenu && (
        <FolderContextMenu
          folder={contextMenu.folder}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onRename={() => { onRename(contextMenu.folder.id); closeContextMenu() }}
          onDelete={() => { onDelete(contextMenu.folder.id); closeContextMenu() }}
          onAddSubfolder={() => { onAddSubfolder(contextMenu.folder.id); closeContextMenu() }}
        />
      )}
    </>
  )
}
