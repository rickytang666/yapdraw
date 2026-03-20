'use client'

import type { SaveStatus } from '@/hooks/useAutoSave'

interface Props {
  status: SaveStatus
}

export default function SaveStatusIndicator({ status }: Props) {
  if (status === 'idle') return null

  const config = {
    saving: { text: 'Syncing…',    className: 'text-placeholder' },
    saved:  { text: 'Synced',      className: 'text-[#10B981]' },
    error:  { text: 'Sync failed', className: 'text-[#EF4444]' },
    quota:  { text: 'Storage full — export diagrams to free space', className: 'text-[#F59E0B]' },
  } as const

  const { text, className } = config[status]

  return (
    <span className={`text-xs font-medium ${className}`}>{text}</span>
  )
}
