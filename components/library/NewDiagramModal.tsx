'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX, IconTemplate } from '@tabler/icons-react'
import type { DiagramType, DiagramTemplate } from '@/types/library'
import TemplatePicker from './TemplatePicker'

const DIAGRAM_TYPES: { value: DiagramType; label: string; description: string }[] = [
  { value: 'freeform', label: 'Freeform', description: 'Open canvas, no constraints' },
  { value: 'system-architecture', label: 'System Architecture', description: 'System and component diagrams' },
  { value: 'operations-flowchart', label: 'Operations Flowchart', description: 'Process flows and decisions' },
]

interface Props {
  onConfirm: (name: string, diagramType: DiagramType, template?: DiagramTemplate) => void
  onCancel: () => void
}

export default function NewDiagramModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>('freeform')
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramTemplate | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(
      name.trim() || 'Untitled Diagram',
      diagramType,
      selectedTemplate ?? undefined
    )
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  function handleTemplateSelect(template: DiagramTemplate) {
    setSelectedTemplate(template)
    setDiagramType(template.suggestedType)
    setShowTemplatePicker(false)
  }

  function handleClearTemplate() {
    setSelectedTemplate(null)
  }

  return (
    <>
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onCancel={() => setShowTemplatePicker(false)}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white border border-border-subtle rounded-xl shadow-2xl w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <h2 className="text-foreground font-semibold text-base">New Diagram</h2>
            <button
              onClick={onCancel}
              className="text-subtle hover:text-foreground transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-muted text-sm">Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Untitled Diagram"
                className="bg-background border border-border focus:border-primary outline-none rounded-md px-3 py-2 text-foreground text-sm placeholder-placeholder transition-colors"
              />
            </div>

            {/* Diagram Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-muted text-sm">Type</label>
              <div className="grid grid-cols-1 gap-2">
                {DIAGRAM_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDiagramType(type.value)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors ${
                      diagramType === type.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border-subtle bg-background text-muted hover:border-placeholder'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{type.label}</span>
                      <span className="text-xs text-placeholder">{type.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Section */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-2 px-3 py-2 bg-background border border-border hover:border-placeholder text-muted hover:text-foreground rounded-md text-sm transition-colors"
              >
                <IconTemplate size={15} />
                Browse Templates
              </button>
              {selectedTemplate && (
                <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/30 rounded-md">
                  <span className="text-sm text-primary truncate">
                    Template: {selectedTemplate.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearTemplate}
                    className="text-subtle hover:text-foreground transition-colors ml-2 shrink-0"
                    aria-label="Clear template"
                  >
                    <IconX size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-subtle hover:text-foreground transition-colors rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-md transition-colors"
              >
                Create Diagram
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
