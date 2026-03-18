'use client'

import { IconArrowBackUp } from '@tabler/icons-react'

interface Props {
  prompt: string
  summary: string
  savedAt: number
  onRestore: () => void
}

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ChangeHistoryEntry({ prompt, summary, savedAt, onRestore }: Props) {
  return (
    <button
      onClick={onRestore}
      className="group w-full text-left flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-blue-500/50 hover:bg-zinc-800 transition-colors"
      title="Click to restore this state"
    >
      {/* prompt */}
      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">"{prompt}"</p>

      {/* summary + timestamp */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500 leading-tight truncate">{summary}</p>
        <span className="text-[10px] text-zinc-600 shrink-0">{relativeTime(savedAt)}</span>
      </div>

      {/* restore hint — only visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconArrowBackUp size={11} className="text-blue-400" />
        <span className="text-[10px] text-blue-400">Restore this state</span>
      </div>
    </button>
  )
}
