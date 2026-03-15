'use client'

import {
  IconBooks,
  IconFolder,
  IconSearchOff,
  IconTrashOff,
} from '@tabler/icons-react'

type Variant = 'empty-library' | 'empty-folder' | 'no-results' | 'empty-trash'

interface Props {
  variant: Variant
}

const CONFIG: Record<Variant, { icon: React.ReactNode; title: string; subtitle: string }> = {
  'empty-library': {
    icon: <IconBooks size={40} />,
    title: 'No diagrams yet',
    subtitle: 'Create your first diagram to get started.',
  },
  'empty-folder': {
    icon: <IconFolder size={40} />,
    title: 'This folder is empty',
    subtitle: 'Move or create diagrams here.',
  },
  'no-results': {
    icon: <IconSearchOff size={40} />,
    title: 'No results found',
    subtitle: 'Try a different search term.',
  },
  'empty-trash': {
    icon: <IconTrashOff size={40} />,
    title: 'Trash is empty',
    subtitle: 'Deleted diagrams appear here for 30 days.',
  },
}

export default function EmptyState({ variant }: Props) {
  const { icon, title, subtitle } = CONFIG[variant]

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6 select-none">
      <div style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>{icon}</div>
      <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  )
}
