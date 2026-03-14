import type { SaveStatus } from '@/hooks/useAutoSave'

interface Props {
  status: SaveStatus
}

export function SaveStatusIndicator({ status }: Props) {
  let label = ''
  if (status === 'saving') label = 'Saving…'
  else if (status === 'saved') label = 'Saved'
  else if (status === 'error') label = 'Save failed'

  if (!label) return null

  return <span className="text-xs text-zinc-400">{label}</span>
}

