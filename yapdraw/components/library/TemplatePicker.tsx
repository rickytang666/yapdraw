'use client'

import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { getAllTemplates } from '@/lib/templates'
import TemplateCard from './TemplateCard'
import type { DiagramTemplate } from '@/types/library'

type CategoryFilter = 'all' | DiagramTemplate['category']

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'data', label: 'Data' },
  { value: 'blank', label: 'Blank' },
]

interface Props {
  onSelect: (template: DiagramTemplate) => void
  onCancel: () => void
}

export default function TemplatePicker({ onSelect, onCancel }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramTemplate | null>(null)

  const allTemplates = getAllTemplates()
  const filtered =
    activeCategory === 'all'
      ? allTemplates
      : allTemplates.filter(t => t.category === activeCategory)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  function handleUseTemplate() {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Templates</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Category tabs — pill style */}
        <div className="flex items-center gap-1.5 px-6 py-3 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                background: activeCategory === tab.value ? 'var(--accent-subtle)' : 'transparent',
                color: activeCategory === tab.value ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                if (activeCategory !== tab.value) e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={e => {
                if (activeCategory !== tab.value) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedTemplate?.id === template.id}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No templates in this category.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {selectedTemplate ? selectedTemplate.name : 'Select a template'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={!selectedTemplate}
              className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => { if (selectedTemplate) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
