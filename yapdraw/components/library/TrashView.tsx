'use client'

import { useEffect, useState } from 'react'
import { IconTrash, IconArrowBackUp, IconAlertTriangle } from '@tabler/icons-react'
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
      {/* Warning banner */}
      {diagrams.length > 0 && (
        <div
          className="flex items-center gap-3 px-8 py-3 text-sm"
          style={{ background: 'var(--accent-subtle)', color: 'var(--text-secondary)' }}
        >
          <IconAlertTriangle size={16} style={{ color: 'var(--star)' }} />
          <span>Items are permanently deleted after 30 days.</span>
          <button
            className="ml-auto text-xs font-medium px-3 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--danger)' }}
            onClick={onEmptyTrash}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Empty Trash
          </button>
        </div>
      )}

      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <IconTrash size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Trash is empty</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-8">
          <div className="flex flex-col gap-2">
            {diagrams.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between px-5 py-3.5 rounded-xl transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Trashed {hasMounted && d.trashedAt ? formatDate(d.trashedAt) : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => onRestore(d.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <IconArrowBackUp size={14} />
                    Restore
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => onDelete(d.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
