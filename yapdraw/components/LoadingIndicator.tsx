'use client'

import { IconLoader2 } from '@tabler/icons-react'

interface LoadingIndicatorProps {
  isLoading: boolean
}

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm text-xs text-zinc-500">
      <IconLoader2 size={14} className="animate-spin" />
      Thinking...
    </div>
  )
}
