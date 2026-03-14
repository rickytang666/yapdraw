 'use client'

import { useEffect, useState } from 'react'
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
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
        <p className="text-sm text-zinc-400">
          {diagrams.length} item{diagrams.length !== 1 ? 's' : ''} in trash
        </p>
        {diagrams.length > 0 && (
          <button
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
            onClick={onEmptyTrash}
          >
            Empty Trash
          </button>
        )}
      </div>

      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-2">
          <IconTrash size={40} className="opacity-30" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-4">
          <div className="flex flex-col gap-2">
            {diagrams.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                <div>
                  <p className="text-sm font-medium text-white">{d.name}</p>
                  <p className="text-xs text-zinc-500">
                    Trashed {hasMounted && d.trashedAt ? formatDate(d.trashedAt) : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 transition-colors"
                    onClick={() => onRestore(d.id)}
                  >
                    <IconArrowBackUp size={14} />
                    Restore
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
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
