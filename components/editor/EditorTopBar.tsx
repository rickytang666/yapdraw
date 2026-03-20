'use client'

import { IconArrowLeft, IconStar, IconStarFilled, IconLock, IconBookmark, IconSettings } from '@tabler/icons-react'
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
  onSaveVersion?: () => void
  onOpenSettings?: () => void
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
  onSaveVersion,
  onOpenSettings,
  canvasRef,
}: Props) {
  return (
    <header className="flex items-center gap-3 h-12 px-4 bg-white border-b border-border-subtle shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-subtle hover:text-foreground transition-colors"
        aria-label="Back to library"
      >
        <IconArrowLeft size={18} />
        <span className="text-sm hidden sm:inline">Library</span>
      </button>

      <div className="w-px h-5 bg-border-subtle" />

      <InlineName value={diagram.name} onCommit={name => onRename?.(name)} />

      <button
        onClick={() => onStar?.(!diagram.starred)}
        className="text-placeholder hover:text-[#F59E0B] transition-colors ml-1"
        aria-label={diagram.starred ? 'Unstar diagram' : 'Star diagram'}
      >
        {diagram.starred
          ? <IconStarFilled size={16} className="text-[#F59E0B]" />
          : <IconStar size={16} />
        }
      </button>

      {diagram.locked && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FEF3C7] border border-[#F59E0B]/40 rounded text-[#D97706]">
          <IconLock size={12} />
          <span className="text-xs font-medium">Locked</span>
        </div>
      )}

      <div className="flex-1" />

      <SaveStatusIndicator status={saveStatus} />

      {onSaveVersion && (
        <button
          onClick={onSaveVersion}
          className="flex items-center gap-1.5 text-xs text-subtle hover:text-foreground hover:bg-surface px-2 py-1 rounded transition-colors"
          aria-label="Save version checkpoint"
        >
          <IconBookmark size={14} />
          <span className="hidden sm:inline">Checkpoint</span>
        </button>
      )}

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 text-xs text-subtle hover:text-foreground hover:bg-surface px-2 py-1 rounded transition-colors"
          aria-label="Open settings"
        >
          <IconSettings size={14} />
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
