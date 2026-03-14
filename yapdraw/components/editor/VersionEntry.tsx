'use client'

import { useState } from 'react'
import { IconRotateClockwise, IconTrash, IconTag } from '@tabler/icons-react'
import type { DiagramVersion } from '@/types/library'

interface Props {
  version: DiagramVersion
  isCurrent: boolean
  onRestore: () => void
  onLabel: (label: string) => void
  onDelete: () => void
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

export default function VersionEntry({ version, isCurrent, onRestore, onLabel, onDelete }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(version.label ?? '')

  function handleLabelCommit() {
    const trimmed = labelInput.trim()
    onLabel(trimmed)
    setIsEditingLabel(false)
  }

  function handleLabelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLabelCommit()
    if (e.key === 'Escape') {
      setLabelInput(version.label ?? '')
      setIsEditingLabel(false)
    }
  }

  return (
    <div
      className={`relative group px-3 py-2.5 rounded-lg transition-colors cursor-default ${
        isCurrent
          ? 'bg-blue-600/20 border border-blue-500/40'
          : 'hover:bg-zinc-800 border border-transparent'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Timestamp */}
          <span className="text-xs text-zinc-400">{relativeTime(version.savedAt)}</span>

          {/* Version number + element count */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">v{version.version}</span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">
              {version.elements.length} element{version.elements.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Label */}
          {isEditingLabel ? (
            <input
              autoFocus
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onBlur={handleLabelCommit}
              onKeyDown={handleLabelKeyDown}
              placeholder="Add a label…"
              className="mt-1 text-xs bg-zinc-700 border border-zinc-600 focus:border-blue-500 outline-none rounded px-2 py-0.5 text-white placeholder-zinc-500 w-full"
              onClick={e => e.stopPropagation()}
            />
          ) : version.label ? (
            <button
              className="mt-1 text-xs text-blue-400 hover:text-blue-300 text-left transition-colors truncate"
              onClick={() => setIsEditingLabel(true)}
            >
              {version.label}
            </button>
          ) : (
            isHovered && (
              <button
                className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={() => setIsEditingLabel(true)}
              >
                <IconTag size={10} />
                Add label
              </button>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isCurrent ? (
            <span className="text-xs text-blue-400 font-medium px-1.5 py-0.5 bg-blue-500/20 rounded">
              Current
            </span>
          ) : (
            isHovered && (
              <button
                onClick={onRestore}
                className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white px-1.5 py-0.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                title="Restore this version"
              >
                <IconRotateClockwise size={11} />
                Restore
              </button>
            )
          )}
          {isHovered && !isCurrent && (
            <button
              onClick={onDelete}
              className="p-0.5 text-zinc-500 hover:text-red-400 transition-colors rounded"
              title="Delete this version"
            >
              <IconTrash size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
