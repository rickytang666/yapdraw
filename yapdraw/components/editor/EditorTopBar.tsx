'use client'

import { IconArrowLeft, IconStar, IconStarFilled } from '@tabler/icons-react'
import type { Diagram } from '@/types/library'
import type { SaveStatus } from '@/hooks/useAutoSave'
import InlineName from './InlineName'
import SaveStatusIndicator from './SaveStatusIndicator'

interface Props {
  diagram: Diagram
  saveStatus: SaveStatus
  onBack: () => void
  onRename?: (name: string) => void
  onStar?: (starred: boolean) => void
}

export default function EditorTopBar({ diagram, saveStatus, onBack, onRename, onStar }: Props) {
  return (
    <header className="flex items-center gap-3 h-12 px-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        aria-label="Back to library"
      >
        <IconArrowLeft size={18} />
        <span className="text-sm hidden sm:inline">Library</span>
      </button>

      <div className="w-px h-5 bg-zinc-700" />

      <InlineName value={diagram.name} onCommit={name => onRename?.(name)} />

      <button
        onClick={() => onStar?.(!diagram.starred)}
        className="text-zinc-400 hover:text-yellow-400 transition-colors ml-1"
        aria-label={diagram.starred ? 'Unstar diagram' : 'Star diagram'}
      >
        {diagram.starred
          ? <IconStarFilled size={16} className="text-yellow-400" />
          : <IconStar size={16} />
        }
      </button>

      <div className="flex-1" />

      <SaveStatusIndicator status={saveStatus} />
    </header>
  )
}
