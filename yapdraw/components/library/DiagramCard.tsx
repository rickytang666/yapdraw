import { useRouter } from 'next/navigation'
import type { Diagram } from '@/types/library'

interface Props {
  diagram: Diagram
}

export default function DiagramCard({ diagram }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/d/${diagram.id}`)}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-left hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
    >
      <div className="aspect-video w-full bg-zinc-800 flex items-center justify-center">
        {diagram.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={diagram.thumbnail} alt={diagram.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-zinc-500">No preview</span>
        )}
      </div>
      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="text-sm font-medium text-zinc-100 truncate">{diagram.name}</div>
        <div className="text-[11px] text-zinc-500">
          Updated {new Date(diagram.updatedAt).toLocaleString()}
        </div>
      </div>
    </button>
  )
}

