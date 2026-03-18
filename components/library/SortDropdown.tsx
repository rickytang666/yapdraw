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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#D1D5DB] hover:border-[#94A3B8] text-[#475569] hover:text-[#0F172A] text-sm transition-colors"
      >
        <span>{FIELD_LABELS[sortField]}</span>
        {sortDirection === 'asc' ? (
          <IconArrowUp size={12} className="text-[#94A3B8]" />
        ) : (
          <IconArrowDown size={12} className="text-[#94A3B8]" />
        )}
        <IconChevronDown size={12} className="text-[#94A3B8]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-xl overflow-hidden py-1">
          {SORT_OPTIONS.map(({ field, label }) => {
            const isActive = field === sortField
            return (
              <button
                key={field}
                onClick={() => handleSelect(field)}
                className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  sortDirection === 'asc'
                    ? <IconArrowUp size={13} className="text-[#5B57D1]" />
                    : <IconArrowDown size={13} className="text-[#5B57D1]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
