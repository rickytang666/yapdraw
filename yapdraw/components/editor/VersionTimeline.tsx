'use client'

import { useEffect, useRef, useState } from 'react'
import { IconArrowBackUp, IconX } from '@tabler/icons-react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import { decodeAIMeta } from '@/lib/versionMeta'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'
import type { DiagramVersion } from '@/types/library'

interface Props {
  diagramId: string
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  onRestoreAnimation: () => void
  pauseSave: (liveElements: ExcalidrawElement[]) => void
  resumeSave: () => void
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

function versionLabel(v: DiagramVersion): string | null {
  const meta = decodeAIMeta(v.label)
  if (meta) return `"${meta.prompt}"`
  if (v.label && v.label !== 'Before restore') return v.label
  return null
}

export default function VersionTimeline({ diagramId, canvasRef, onRestoreAnimation, pauseSave, resumeSave }: Props) {
  const { versions, restoreVersion } = useVersionHistory(diagramId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const liveSnapshotRef = useRef<ExcalidrawElement[] | null>(null)

  // Auto-scroll to latest version when new ones appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [versions.length])

  // Update relative times every 30 seconds
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  function handleSelect(v: DiagramVersion) {
    if (selectedId === v.id) {
      // Deselect — cancel preview
      handleCancelView()
      return
    }

    // Save live state on first preview and pause auto-save
    if (!isViewing) {
      const live = canvasRef.current?.getElements() ?? []
      liveSnapshotRef.current = live
      pauseSave(live)
    }

    setSelectedId(v.id)
    setIsViewing(true)
    canvasRef.current?.updateDiagram(v.elements as ExcalidrawElement[], { replace: true })
  }

  function handleCancelView() {
    if (liveSnapshotRef.current) {
      canvasRef.current?.updateDiagram(liveSnapshotRef.current, { replace: true })
    }
    resumeSave()
    setSelectedId(null)
    setIsViewing(false)
    liveSnapshotRef.current = null
  }

  async function handleRevert(versionId: string) {
    const target = versions.find(v => v.id === versionId)
    if (!target) return

    // If not already viewing, show it on canvas
    if (!isViewing) {
      canvasRef.current?.updateDiagram(target.elements as ExcalidrawElement[], { replace: true })
    }

    resumeSave()
    await restoreVersion(versionId)
    onRestoreAnimation()
    setSelectedId(null)
    setIsViewing(false)
    liveSnapshotRef.current = null
  }

  // Escape key to cancel view
  useEffect(() => {
    if (!isViewing) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCancelView()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isViewing])

  if (versions.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium mb-2">
          Version History
        </p>
        <p className="text-[11px] text-zinc-600">
          Versions appear here as you work.
        </p>
      </div>
    )
  }

  const selectedVersion = selectedId ? versions.find(v => v.id === selectedId) : null
  const selectedDisplayNum = selectedVersion
    ? versions.length - versions.findIndex(v => v.id === selectedVersion.id)
    : 0

  return (
    <div className="border-b border-zinc-800">
      {/* Label */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
          Version History
        </p>
        {isViewing && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[10px] text-violet-400">Previewing</span>
          </div>
        )}
      </div>

      {/* Timeline strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto px-4 py-2 hide-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {versions.map((v, i, arr) => {
          const displayNum = arr.length - i
          const isSelected = v.id === selectedId
          const isCurrent = i === 0
          // Current version is "reverted" if the latest snapshot was a restore
          const isReverted = isCurrent && arr[0]?.label === 'Before restore'
          const meta = decodeAIMeta(v.label)

          return (
            <div key={v.id} className="flex items-center shrink-0">
              {/* Connector line */}
              {i > 0 && (
                <div className="w-4 h-px bg-zinc-700" />
              )}

              {/* Version node */}
              <button
                onClick={() => handleSelect(v)}
                className={`relative flex flex-col items-center group transition-all ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
                title={`v${displayNum} · ${relativeTime(v.savedAt)} · ${v.elements.length} elements`}
              >
                {/* Circle — only the current version is colored */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isCurrent && isReverted
                      ? 'border-violet-400 bg-violet-500/30'
                      : isCurrent
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-zinc-600 bg-zinc-800 group-hover:border-zinc-400'
                  }`}
                >
                  <span className="text-[8px] font-bold text-zinc-300">{displayNum}</span>
                </div>

                {/* Time label below */}
                <span className={`text-[8px] mt-1 whitespace-nowrap ${
                  isSelected ? 'text-violet-400' : 'text-zinc-600'
                }`}>
                  {relativeTime(v.savedAt)}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Selected version detail panel */}
      {selectedVersion && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-zinc-300">
                  Version {selectedDisplayNum}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {relativeTime(selectedVersion.savedAt)}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {selectedVersion.elements.length} elements
                </span>
              </div>
              {versionLabel(selectedVersion) && (
                <p className="text-[11px] text-zinc-400 line-clamp-2">
                  {versionLabel(selectedVersion)}
                </p>
              )}
            </div>
            <button
              onClick={handleCancelView}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Close preview"
            >
              <IconX size={12} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleRevert(selectedVersion.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-violet-600/40 hover:bg-violet-600 text-violet-200 hover:text-white transition-colors"
            >
              <IconArrowBackUp size={12} />
              Revert to this version
            </button>
            <button
              onClick={handleCancelView}
              className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
