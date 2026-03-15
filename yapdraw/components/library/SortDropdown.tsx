'use client'

import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import type { SortField, SortDirection } from '@/types/library'

interface Props {
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField, dir: SortDirection) => void
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'updatedAt', label: 'Updated' },
  { field: 'createdAt', label: 'Created' },
  { field: 'lastOpenedAt', label: 'Opened' },
  { field: 'name', label: 'Name' },
  { field: 'diagramType', label: 'Type' },
  { field: 'elementCount', label: 'Elements' },
]

const FIELD_LABELS: Record<SortField, string> = {
  updatedAt: 'Updated',
  createdAt: 'Created',
  lastOpenedAt: 'Opened',
  name: 'Name',
  diagramType: 'Type',
  elementCount: 'Elements',
}

export default function SortDropdown({ sortField, sortDirection, onSort }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function handleSelect(field: SortField) {
    if (field === sortField) {
      onSort(field, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(field, 'desc')
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <span>{FIELD_LABELS[sortField]}</span>
        {sortDirection === 'asc' ? (
          <IconArrowUp size={12} style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <IconArrowDown size={12} style={{ color: 'var(--text-tertiary)' }} />
        )}
        <IconChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl shadow-xl overflow-hidden py-1"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {SORT_OPTIONS.map(({ field, label }) => {
            const isActive = field === sortField
            return (
              <button
                key={field}
                onClick={() => handleSelect(field)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm transition-colors text-left"
                style={{
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isActive ? 'var(--bg-tertiary)' : 'transparent'
                }}
              >
                <span>{label}</span>
                {isActive && (
                  sortDirection === 'asc'
                    ? <IconArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    : <IconArrowDown size={13} style={{ color: 'var(--accent)' }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
