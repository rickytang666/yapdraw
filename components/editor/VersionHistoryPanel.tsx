'use client'

import { useEffect, useRef, useState } from 'react'
import { IconHistory, IconArrowBack, IconArrowBackUp } from '@tabler/icons-react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import VersionEntry from './VersionEntry'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'

interface Props {
  diagramId: string
  isOpen: boolean
  onClose: () => void
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  onRestoreAnimation: () => void
}

export default function VersionHistoryPanel({
  diagramId,
  isOpen,
  onClose,
  canvasRef,
  onRestoreAnimation,
}: Props) {
  const { versions, restoreVersion } = useVersionHistory(diagramId)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null)
  const liveSnapshotRef = useRef<ExcalidrawElement[] | null>(null)

  function handleClose() {
    if (viewingVersionId) handleCancelView()
    onClose()
  }

  function handleCancelView() {
    if (liveSnapshotRef.current) {
      canvasRef.current?.updateDiagram(liveSnapshotRef.current, { replace: true })
    }
    setViewingVersionId(null)
    liveSnapshotRef.current = null
  }

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen, viewingVersionId])

  // Escape: cancel view mode first, then close
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (viewingVersionId) handleCancelView()
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, viewingVersionId, onClose])

  function handleView(versionId: string, elements: ExcalidrawElement[]) {
    if (viewingVersionId === versionId) {
      handleCancelView()
      return
    }
    if (!viewingVersionId) {
      liveSnapshotRef.current = canvasRef.current?.getElements() ?? []
    }
    setViewingVersionId(versionId)
    canvasRef.current?.updateDiagram(elements, { replace: true })
  }

  async function handleRestore(versionId: string) {
    // If not already viewing this version, preview it first so the canvas already shows it
    const target = versions.find(v => v.id === versionId)
    if (target && viewingVersionId !== versionId) {
      canvasRef.current?.updateDiagram(target.elements as ExcalidrawElement[], { replace: true })
    }
    await restoreVersion(versionId)
    onRestoreAnimation()
    setViewingVersionId(null)
    liveSnapshotRef.current = null
    onClose()
  }

  const viewingVersion = viewingVersionId ? versions.find(v => v.id === viewingVersionId) : null
  const currentVersionId = versions.length > 0 ? versions[0].id : null

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="fixed top-12 right-4 z-50 w-68 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
      style={{ width: 272 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
        <IconHistory size={13} className="text-zinc-500" />
        <span className="text-xs text-zinc-400 font-medium">Version History</span>
      </div>

      {/* View mode banner */}
      {viewingVersion && (
        <div className="px-3 py-2 bg-violet-950/70 border-b border-violet-900/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] text-violet-300">Viewing v{viewingVersion.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCancelView}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
              >
                <IconArrowBack size={10} />
                Cancel
              </button>
              <button
                onClick={() => handleRestore(viewingVersion.id)}
                className="flex items-center gap-1 text-[11px] text-violet-300 hover:text-white px-2 py-1 rounded bg-violet-600/40 hover:bg-violet-600 transition-colors"
              >
                <IconArrowBackUp size={10} />
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version list */}
      <div className="overflow-y-auto py-1" style={{ maxHeight: 320 }}>
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 px-4">
            <IconHistory size={24} className="text-zinc-700" />
            <p className="text-xs text-zinc-600 text-center">No versions yet. Versions are saved automatically as you work.</p>
          </div>
        ) : (
          versions.map(v => (
            <VersionEntry
              key={v.id}
              version={v}
              isCurrent={v.id === currentVersionId}
              isViewing={v.id === viewingVersionId}
              onView={() => handleView(v.id, v.elements as ExcalidrawElement[])}
              onRestore={() => handleRestore(v.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-700">Old versions are pruned automatically. </p>
      </div>
    </div>
  )
}
