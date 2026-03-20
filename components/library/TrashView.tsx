 'use client'

import { useSyncExternalStore } from 'react'
import { IconTrash, IconArrowBackUp } from '@tabler/icons-react'
import type { Diagram } from '@/types/library'

interface Props {
  diagrams: Diagram[]
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onEmptyTrash: () => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function TrashView({ diagrams, onRestore, onDelete, onEmptyTrash }: Props) {
  const hasMounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <p className="text-sm text-placeholder">
          {diagrams.length} item{diagrams.length !== 1 ? 's' : ''} in trash
        </p>
        {diagrams.length > 0 && (
          <button
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
            onClick={onEmptyTrash}
          >
            Empty Trash
          </button>
        )}
      </div>

      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-placeholder gap-2">
          <IconTrash size={40} className="opacity-30" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-4">
          <div className="flex flex-col gap-2">
            {diagrams.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-border-subtle"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-placeholder">
                    Trashed {hasMounted && d.trashedAt ? formatDate(d.trashedAt) : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs text-muted hover:text-green-600 transition-colors"
                    onClick={() => onRestore(d.id)}
                  >
                    <IconArrowBackUp size={14} />
                    Restore
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs text-muted hover:text-red-500 transition-colors"
                    onClick={() => onDelete(d.id)}
                  >
                    <IconTrash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
