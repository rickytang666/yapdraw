import type { Diagram } from '@/types/library'
import { SaveStatusIndicator } from './SaveStatusIndicator'
import { InlineName } from './InlineName'

interface EditorTopBarProps {
  diagram: Diagram
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onBack: () => void
}

export default function EditorTopBar({ diagram, saveStatus, onBack }: EditorTopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-zinc-700 px-2 py-1 text-sm hover:bg-zinc-800"
        >
          Back
        </button>
        <InlineName id={diagram.id} initialName={diagram.name} />
      </div>
      <div className="flex items-center gap-3">
        <SaveStatusIndicator status={saveStatus} />
      </div>
    </header>
  )
}

