'use client'

import { IconTemplate, IconChartDots, IconLayoutDashboard, IconDatabase, IconX } from '@tabler/icons-react'
import type { DiagramTemplate } from '@/types/library'

interface Props {
  template: DiagramTemplate
  selected: boolean
  onClick: () => void
}

const CATEGORY_LABELS: Record<DiagramTemplate['category'], string> = {
  architecture: 'Architecture',
  flowchart: 'Flowchart',
  data: 'Data',
  blank: 'Blank',
}

const CATEGORY_COLORS: Record<DiagramTemplate['category'], string> = {
  architecture: 'bg-purple-500/20 text-purple-300',
  flowchart: 'bg-blue-500/20 text-blue-300',
  data: 'bg-green-500/20 text-green-300',
  blank: 'bg-zinc-700 text-zinc-400',
}

function CategoryIcon({ category }: { category: DiagramTemplate['category'] }) {
  const cls = 'w-8 h-8 opacity-60'
  switch (category) {
    case 'architecture':
      return <IconLayoutDashboard className={cls} />
    case 'flowchart':
      return <IconChartDots className={cls} />
    case 'data':
      return <IconDatabase className={cls} />
    case 'blank':
      return <IconTemplate className={cls} />
    default:
      return <IconTemplate className={cls} />
  }
}

export default function TemplateCard({ template, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 p-3 rounded-lg border text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750'
      }`}
    >
      {/* Preview area */}
      <div className="flex items-center justify-center h-14 w-full rounded-md bg-zinc-900/60 border border-zinc-700/50">
        <CategoryIcon category={template.category} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <span className="text-sm font-medium text-white leading-tight line-clamp-1">
            {template.name}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${CATEGORY_COLORS[template.category]}`}
          >
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      </div>
    </button>
  )
}
