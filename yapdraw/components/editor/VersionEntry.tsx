'use client'

import { useState } from 'react'
import { IconEye, IconArrowBackUp } from '@tabler/icons-react'
import type { DiagramVersion } from '@/types/library'

interface Props {
  version: DiagramVersion
  isCurrent: boolean
  isViewing: boolean
  onView: () => void
  onRestore: () => void
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export default function VersionEntry({ version, isCurrent, isViewing, onView, onRestore }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isViewing
          ? 'bg-violet-500/10 border-l-2 border-violet-500'
          : isCurrent
          ? 'bg-zinc-800/60'
          : 'hover:bg-zinc-800/50'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status dot */}
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        isViewing ? 'bg-violet-400' : isCurrent ? 'bg-blue-400' : 'bg-zinc-600'
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500">v{version.version}</span>
          <span className="text-[11px] text-zinc-700">·</span>
          <span className="text-[11px] text-zinc-500">{relativeTime(version.savedAt)}</span>
          <span className="text-[11px] text-zinc-700">·</span>
          <span className="text-[11px] text-zinc-600">{version.elements.length}el</span>
        </div>
        {version.label && (
          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{version.label}</p>
        )}
      </div>

      {/* Actions */}
      {isCurrent ? (
        <span className="text-[10px] text-zinc-600 font-medium shrink-0">current</span>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView}
            title="Preview this version"
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[11px] transition-colors ${
              isViewing
                ? 'text-violet-400 bg-violet-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <IconEye size={11} />
            {hovered && <span>View</span>}
          </button>
          <button
            onClick={onRestore}
            title="Restore this version"
            className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <IconArrowBackUp size={11} />
            {hovered && <span>Restore</span>}
          </button>
        </div>
      )}
    </div>
  )
}
