interface Props {
  label: string
  active: boolean
  count?: number
  onClick: () => void
}

export default function SidebarFixedSection({ label, active, count, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
        active ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-xs rounded-full bg-zinc-700 px-2 py-0.5">{count}</span>
      )}
    </button>
  )
}

