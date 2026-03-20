'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { IconArrowBackUp, IconClock, IconChevronRight, IconX } from '@tabler/icons-react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import { decodeAIMeta } from '@/lib/versionMeta'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'
import type { DiagramVersion } from '@/types/library'

export interface VersionTimelineHandle {
  navigatePrev: () => void
  navigateNext: () => void
}

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
  if (meta) return meta.prompt
  if (v.label && v.label !== 'Before restore') return v.label
  return null
}

const VersionTimeline = forwardRef<VersionTimelineHandle, Props>(function VersionTimeline(
  { diagramId, canvasRef, onRestoreAnimation, pauseSave, resumeSave },
  ref,
) {
  const { versions, restoreVersion } = useVersionHistory(diagramId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const liveSnapshotRef = useRef<ExcalidrawElement[] | null>(null)

  // Update relative times every 30 seconds
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const handleCancelView = useCallback(() => {
    if (liveSnapshotRef.current) {
      canvasRef.current?.updateDiagram(liveSnapshotRef.current, { replace: true })
    }
    resumeSave()
    setSelectedId(null)
    setIsViewing(false)
    liveSnapshotRef.current = null
  }, [canvasRef, resumeSave])

  const handleSelect = useCallback((v: DiagramVersion) => {
    if (selectedId === v.id) {
      handleCancelView()
      return
    }
    if (!isViewing) {
      const live = canvasRef.current?.getElements() ?? []
      liveSnapshotRef.current = live
      pauseSave(live)
    }
    setSelectedId(v.id)
    setIsViewing(true)
    canvasRef.current?.updateDiagram(v.elements as ExcalidrawElement[], { replace: true })
  }, [selectedId, isViewing, canvasRef, pauseSave, handleCancelView])

  const handleRevert = async (versionId: string) => {
    const target = versions.find(v => v.id === versionId)
    if (!target) return
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

  // escape to cancel preview
  useEffect(() => {
    if (!isViewing) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCancelView()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isViewing, handleCancelView])

  useImperativeHandle(ref, () => ({
    navigatePrev() {
      if (versions.length === 0) return
      if (!selectedId) {
        if (versions.length > 1) handleSelect(versions[1])
        return
      }
      const idx = versions.findIndex(v => v.id === selectedId)
      if (idx < versions.length - 1) handleSelect(versions[idx + 1])
    },
    navigateNext() {
      if (!selectedId) return
      const idx = versions.findIndex(v => v.id === selectedId)
      if (idx === 0) handleCancelView()
      else handleSelect(versions[idx - 1])
    },
  }), [versions, selectedId, handleSelect, handleCancelView])

  const selectedVersion = selectedId ? versions.find(v => v.id === selectedId) : null
  const selectedDisplayNum = selectedVersion
    ? versions.length - versions.findIndex(v => v.id === selectedVersion.id)
    : 0

  if (versions.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-1.5 mb-2">
          <IconClock size={12} className="text-placeholder" />
          <span className="text-[11px] font-semibold text-foreground">Versions</span>
        </div>
        <p className="text-[11px] text-placeholder">Versions appear here as you work.</p>
      </div>
    )
  }

  return (
    <div className="border-b border-border-subtle">
      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconClock size={12} className="text-placeholder" />
          <span className="text-[11px] font-semibold text-foreground">Versions</span>
          <span className="text-[10px] text-placeholder bg-surface px-1.5 py-0.5 rounded-full tabular-nums">
            {versions.length}
          </span>
        </div>
        {isViewing && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[10px] font-medium text-violet-600">Previewing</span>
          </div>
        )}
      </div>

      {/* Horizontal timeline strip */}
      <div
        className="flex items-center overflow-x-auto px-4 py-2.5 hide-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {versions.map((v, i, arr) => {
          const displayNum = arr.length - i
          const isSelected = v.id === selectedId
          const isCurrent = i === 0

          return (
            <div key={v.id} className="flex items-center shrink-0">
              {/* Chevron connector — self-start + mt-[6px] aligns it with the circle center
                  (circle is 24px, center at 12px; chevron is 12px, so top offset = 12 - 6 = 6px) */}
              {i > 0 && (
                <IconChevronRight size={12} className="text-[#CBD5E1] mx-0.5 shrink-0 self-start mt-[6px]" />
              )}

              {/* Version node */}
              <button
                onClick={() => handleSelect(v)}
                className={`relative flex flex-col items-center group transition-all ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
                title={`v${displayNum} · ${relativeTime(v.savedAt)} · ${v.elements.length} elements`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-violet-400 bg-violet-100'
                    : isCurrent
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-border bg-white group-hover:border-placeholder group-hover:bg-background'
                }`}>
                  <span className={`text-[8px] font-bold ${
                    isSelected ? 'text-violet-700' : isCurrent ? 'text-emerald-700' : 'text-placeholder group-hover:text-subtle'
                  }`}>
                    {displayNum}
                  </span>
                </div>
                <span className={`text-[8px] mt-1 whitespace-nowrap tabular-nums ${
                  isSelected ? 'text-violet-500' : 'text-[#CBD5E1]'
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
        <div className="mx-4 mb-3 rounded-lg border border-border-subtle bg-background overflow-hidden">
          <div className="px-3 py-2.5 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-foreground">
                  Version {selectedDisplayNum}
                </span>
                <span className="text-[10px] text-placeholder">
                  {relativeTime(selectedVersion.savedAt)}
                </span>
                <span className="text-[10px] text-[#CBD5E1]">
                  {selectedVersion.elements.length} els
                </span>
              </div>
              {versionLabel(selectedVersion) && (
                <p className="text-[11px] text-subtle line-clamp-2 italic">
                  {'"'}{versionLabel(selectedVersion)}{'"'}
                </p>
              )}
            </div>
            <button
              onClick={handleCancelView}
              className="p-1 text-[#CBD5E1] hover:text-subtle transition-colors rounded"
              title="Close preview"
            >
              <IconX size={12} />
            </button>
          </div>
          <div className="px-3 pb-2.5 flex items-center gap-2 border-t border-border-subtle pt-2">
            <button
              onClick={() => handleRevert(selectedVersion.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              <IconArrowBackUp size={12} />
              Restore this version
            </button>
            <button
              onClick={handleCancelView}
              className="px-3 py-1.5 rounded-md text-[11px] text-subtle hover:bg-[#E2E8F0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default VersionTimeline
