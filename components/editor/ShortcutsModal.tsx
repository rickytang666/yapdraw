'use client'

import { useEffect, useRef } from 'react'
import { IconX } from '@tabler/icons-react'

interface Props {
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface border border-border rounded text-[11px] font-mono text-subtle">
      {children}
    </kbd>
  )
}

const SHORTCUTS = [
  { keys: [mod, 'S'],        label: 'Save' },
  { keys: [mod, 'K'],        label: 'Focus text input' },
  { keys: [mod, 'E'],        label: 'Open export menu' },
  { keys: [mod, '⇧', 'L'],  label: 'Lock / unlock diagram' },
  { keys: ['['],             label: 'Preview previous version' },
  { keys: [']'],             label: 'Preview next version' },
  { keys: ['?'],             label: 'Show this help' },
]

export default function ShortcutsModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { overlayRef.current?.focus() }, [])

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 outline-none"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          <button onClick={onClose} className="text-placeholder hover:text-muted transition-colors">
            <IconX size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-subtle">{label}</span>
              <div className="flex items-center gap-1 shrink-0">
                {keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
