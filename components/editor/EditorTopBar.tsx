'use client'

import { IconArrowLeft, IconStar, IconStarFilled, IconLock } from '@tabler/icons-react'
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
  canvasRef,
}: Props) {
  return (
    <header className="flex items-center gap-3 h-12 px-4 bg-white border-b border-[#E5E7EB] shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#64748B] hover:text-[#0F172A] transition-colors"
        aria-label="Back to library"
      >
        <IconArrowLeft size={18} />
        <span className="text-sm hidden sm:inline">Library</span>
      </button>

      <div className="w-px h-5 bg-[#E5E7EB]" />

      <InlineName value={diagram.name} onCommit={name => onRename?.(name)} />

      <button
        onClick={() => onStar?.(!diagram.starred)}
        className="text-[#94A3B8] hover:text-[#F59E0B] transition-colors ml-1"
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

      {canvasRef && onDuplicate && onToggleLock && (
        <EditorMenu
          diagram={diagram}
          canvasRef={canvasRef}
          onDuplicate={onDuplicate}
          onToggleLock={onToggleLock}
          onSaveVersion={onSaveVersion}
        />
      )}
    </header>
  )
}
