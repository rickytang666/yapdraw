import type { Diagram } from '@/types/library'
import DiagramCard from './DiagramCard'

interface Props {
  diagrams: Diagram[]
}

export default function DiagramGrid({ diagrams }: Props) {
  if (!diagrams.length) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        No diagrams yet. Create your first one.
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
      {diagrams.map((d) => (
        <DiagramCard key={d.id} diagram={d} />
      ))}
    </div>
  )
}

