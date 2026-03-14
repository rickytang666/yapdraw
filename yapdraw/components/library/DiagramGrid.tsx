'use client'

import type { Diagram } from '@/types/library'
import DiagramCard from './DiagramCard'

interface Props {
  diagrams: Diagram[]
  onStar: (id: string, starred: boolean) => void
  onTrash: (id: string) => void
  onDuplicate: (id: string) => void
}

export default function DiagramGrid({ diagrams, onStar, onTrash, onDuplicate }: Props) {
  if (diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-2">
        <p className="text-lg">No diagrams yet</p>
        <p className="text-sm">Create a new diagram to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {diagrams.map(diagram => (
        <DiagramCard
          key={diagram.id}
          diagram={diagram}
          onStar={starred => onStar(diagram.id, starred)}
          onTrash={() => onTrash(diagram.id)}
          onDuplicate={() => onDuplicate(diagram.id)}
        />
      ))}
    </div>
  )
}
