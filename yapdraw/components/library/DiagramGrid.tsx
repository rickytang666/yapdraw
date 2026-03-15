'use client'

import { motion } from 'framer-motion'
import type { Diagram, Folder } from '@/types/library'
import DiagramCard from './DiagramCard'
import EmptyState from './EmptyState'

interface Props {
  diagrams: Diagram[]
  folders: Folder[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onTrash: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, name: string) => void
  onMove: (id: string, folderId: string | null) => void
  emptyVariant?: 'empty-library' | 'empty-folder' | 'no-results'
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function DiagramGrid({
  diagrams,
  folders,
  selectedIds,
  onToggleSelect,
  onStar,
  onTrash,
  onDuplicate,
  onRename,
  onMove,
  emptyVariant = 'empty-library',
}: Props) {
  if (diagrams.length === 0) {
    return <EmptyState variant={emptyVariant} />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-8"
    >
      {diagrams.map(diagram => (
        <motion.div key={diagram.id} variants={item}>
          <DiagramCard
            diagram={diagram}
            folders={folders}
            selected={selectedIds.has(diagram.id)}
            onToggleSelect={() => onToggleSelect(diagram.id)}
            onStar={starred => onStar(diagram.id, starred)}
            onTrash={() => onTrash(diagram.id)}
            onDuplicate={() => onDuplicate(diagram.id)}
            onRename={name => onRename(diagram.id, name)}
            onMove={folderId => onMove(diagram.id, folderId)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
