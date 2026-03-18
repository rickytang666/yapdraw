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
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-white font-semibold text-base">Choose a Template</h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-800 shrink-0 overflow-x-auto">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === tab.value
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
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
            <p className="text-center text-zinc-500 py-8 text-sm">No templates in this category.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
          <p className="text-xs text-zinc-500">
            {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'Select a template to continue'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={!selectedTemplate}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
