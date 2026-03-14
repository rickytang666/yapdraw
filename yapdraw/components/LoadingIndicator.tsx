'use client'

import { IconLoader2 } from '@tabler/icons-react'

export type LoadingPhase = 'idle' | 'generating' | 'rendering'

const PHASE_LABEL: Record<Exclude<LoadingPhase, 'idle'>, string> = {
  generating: 'Generating...',
  rendering:  'Drawing...',
}

interface LoadingIndicatorProps {
  phase: LoadingPhase
}

export default function LoadingIndicator({ phase }: LoadingIndicatorProps) {
  if (phase === 'idle') return null
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm text-xs text-zinc-500">
      <IconLoader2 size={14} className="animate-spin" />
      {PHASE_LABEL[phase]}
    </div>
  )
}
