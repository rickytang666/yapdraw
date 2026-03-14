'use client'

import { useEffect } from 'react'
import { IconX, IconHistory } from '@tabler/icons-react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import VersionEntry from './VersionEntry'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'

interface Props {
  diagramId: string
  isOpen: boolean
  onClose: () => void
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
}

export default function VersionHistoryPanel({ diagramId, isOpen, onClose, canvasRef }: Props) {
  const { versions, restoreVersion, labelVersion, deleteVersion } = useVersionHistory(diagramId)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleRestore(versionId: string) {
    await restoreVersion(versionId)
    // After restoring, update the canvas with the new diagram elements
    // The diagram update in DB will trigger useLiveQuery in the page
    onClose()
  }

  // The most recent version is considered "current"
  const currentVersionId = versions.length > 0 ? versions[0].id : null

  return (
    <div
      className={`fixed top-0 right-0 h-full z-40 flex flex-col bg-zinc-900 border-l border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <IconHistory size={16} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white transition-colors rounded"
          aria-label="Close version history"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <IconHistory size={32} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No versions saved yet.</p>
            <p className="text-xs text-zinc-600">
              Versions are created automatically as you work.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {versions.map((v) => (
              <VersionEntry
                key={v.id}
                version={v}
                isCurrent={v.id === currentVersionId}
                onRestore={() => handleRestore(v.id)}
                onLabel={(label) => labelVersion(v.id, label)}
                onDelete={() => deleteVersion(v.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <p className="text-xs text-zinc-600">
          Versions are pruned automatically. Labeled versions are kept indefinitely.
        </p>
      </div>
    </div>
  )
}
