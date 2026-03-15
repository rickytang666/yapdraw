'use client'

import { IconArrowLeft, IconStar, IconStarFilled, IconLock, IconHistory } from '@tabler/icons-react'
import type { Diagram } from '@/types/library'
import type { SaveStatus } from '@/hooks/useAutoSave'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import InlineName from './InlineName'
import SaveStatusIndicator from './SaveStatusIndicator'
import EditorMenu from './EditorMenu'

interface Props {
  diagram: Diagram
  saveStatus: SaveStatus
  onBack: () => void
  onRename?: (name: string) => void
  onStar?: (starred: boolean) => void
  onDuplicate?: () => void
  onToggleLock?: () => void
  onHistoryOpen?: () => void
  canvasRef?: React.RefObject<ExcalidrawCanvasHandle | null>
}

export default function EditorTopBar({
  diagram,
  saveStatus,
  onBack,
  onRename,
  onStar,
  onDuplicate,
  onToggleLock,
  onHistoryOpen,
  canvasRef,
}: Props) {
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

      {diagram.locked && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400">
          <IconLock size={12} />
          <span className="text-xs font-medium">Locked</span>
        </div>
      )}

      <div className="flex-1" />

      <SaveStatusIndicator status={saveStatus} />

      {onHistoryOpen && (
        <button
          onClick={onHistoryOpen}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
          aria-label="Version history"
          title="Version history"
        >
          <IconHistory size={16} />
        </button>
      )}

      {canvasRef && onDuplicate && onToggleLock && (
        <EditorMenu
          diagram={diagram}
          canvasRef={canvasRef}
          onDuplicate={onDuplicate}
          onToggleLock={onToggleLock}
        />
      )}
    </header>
  )
}
