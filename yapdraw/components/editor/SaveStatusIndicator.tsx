'use client'

import type { SaveStatus } from '@/hooks/useAutoSave'

interface Props {
  status: SaveStatus
}

export default function SaveStatusIndicator({ status }: Props) {
  if (status === 'idle') return null

  const config = {
    saving: { text: 'Saving…', className: 'text-[#94A3B8]' },
    saved:  { text: 'Saved',   className: 'text-[#10B981]' },
    error:  { text: 'Save failed', className: 'text-[#EF4444]' },
  } as const

  const { text, className } = config[status]

  return (
    <span className={`text-xs font-medium ${className}`}>{text}</span>
  )
}
