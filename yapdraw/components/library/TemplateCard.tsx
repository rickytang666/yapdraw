'use client'

import { IconTemplate, IconChartDots, IconLayoutDashboard, IconDatabase } from '@tabler/icons-react'
import type { DiagramTemplate } from '@/types/library'

interface Props {
  template: DiagramTemplate
  selected: boolean
  onClick: () => void
}

function CategoryIcon({ category }: { category: DiagramTemplate['category'] }) {
  const size = 28
  switch (category) {
    case 'architecture':
      return <IconLayoutDashboard size={size} />
    case 'flowchart':
      return <IconChartDots size={size} />
    case 'data':
      return <IconDatabase size={size} />
    case 'blank':
      return <IconTemplate size={size} />
    default:
      return <IconTemplate size={size} />
  }
}

export default function TemplateCard({ template, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-xl text-left transition-all"
      style={{
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
        border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.borderColor = 'var(--text-tertiary)'
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center h-12 w-full rounded-lg"
        style={{
          background: 'var(--bg-primary)',
          color: selected ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
      >
        <CategoryIcon category={template.category} />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-tight line-clamp-1" style={{ color: 'var(--text-primary)' }}>
          {template.name}
        </span>
        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {template.description}
        </p>
      </div>
    </button>
  )
}
