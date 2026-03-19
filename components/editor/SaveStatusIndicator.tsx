'use client'

import type { SaveStatus } from '@/hooks/useAutoSave'

interface Props {
  status: SaveStatus
}

export default function SaveStatusIndicator({ status }: Props) {
  if (status === 'idle') return null

  const config = {
    saving: { text: 'Syncing…',  className: 'text-[#94A3B8]' },
    saved:  { text: 'Synced',    className: 'text-[#10B981]' },
    error:  { text: 'Sync failed', className: 'text-[#EF4444]' },
  } as const

  const { text, className } = config[status]

  return (
    <span className={`text-xs font-medium ${className}`}>{text}</span>
  )
}
