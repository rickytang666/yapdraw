'use client'

import type { SaveStatus } from '@/hooks/useAutoSave'

interface Props {
  status: SaveStatus
}

export default function SaveStatusIndicator({ status }: Props) {
  if (status === 'idle') return null

  const config = {
    saving: { text: 'Saving…', className: 'text-zinc-400' },
    saved:  { text: 'Saved',   className: 'text-green-500' },
    error:  { text: 'Save failed', className: 'text-red-500' },
  } as const

  const { text, className } = config[status]

  return (
    <span className={`text-xs font-medium ${className}`}>{text}</span>
  )
}
