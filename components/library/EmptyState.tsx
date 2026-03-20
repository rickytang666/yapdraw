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
    icon: <IconBooks size={48} className="text-placeholder" />,
    title: 'No diagrams yet',
    subtitle: 'Create your first diagram to get started.',
  },
  'empty-folder': {
    icon: <IconFolder size={48} className="text-placeholder" />,
    title: 'This folder is empty',
    subtitle: 'Move or create diagrams here.',
  },
  'no-results': {
    icon: <IconSearchOff size={48} className="text-placeholder" />,
    title: 'No results found',
    subtitle: 'Try a different search term or filter.',
  },
  'empty-trash': {
    icon: <IconTrashOff size={48} className="text-placeholder" />,
    title: 'Trash is empty',
    subtitle: 'Deleted diagrams will appear here for 30 days.',
  },
}

export default function EmptyState({ variant }: Props) {
  const { icon, title, subtitle } = CONFIG[variant]

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6 select-none">
      <div className="opacity-60">{icon}</div>
      <p className="text-muted font-medium text-base">{title}</p>
      <p className="text-placeholder text-sm max-w-xs">{subtitle}</p>
    </div>
  )
}
