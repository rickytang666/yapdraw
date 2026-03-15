'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX, IconTemplate } from '@tabler/icons-react'
import type { DiagramType, DiagramTemplate } from '@/types/library'
import TemplatePicker from './TemplatePicker'

const DIAGRAM_TYPES: { value: DiagramType; label: string; description: string }[] = [
  { value: 'freeform', label: 'Freeform', description: 'Open canvas, no constraints' },
  { value: 'flowchart', label: 'Flowchart', description: 'Process flows and decisions' },
  { value: 'architecture', label: 'Architecture', description: 'System and component diagrams' },
  { value: 'sequence', label: 'Sequence', description: 'Interaction and timing diagrams' },
  { value: 'er', label: 'ER Diagram', description: 'Entity-relationship models' },
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
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-[#0F172A] font-semibold text-base">New Diagram</h2>
            <button
              onClick={onCancel}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#475569] text-sm">Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Untitled Diagram"
                className="bg-[#FAFAFA] border border-[#D1D5DB] focus:border-[#5B57D1] outline-none rounded-md px-3 py-2 text-[#0F172A] text-sm placeholder-[#94A3B8] transition-colors"
              />
            </div>

            {/* Diagram Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#475569] text-sm">Type</label>
              <div className="grid grid-cols-1 gap-2">
                {DIAGRAM_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDiagramType(type.value)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors ${
                      diagramType === type.value
                        ? 'border-[#5B57D1] bg-[#5B57D1]/10 text-[#0F172A]'
                        : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#475569] hover:border-[#94A3B8]'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{type.label}</span>
                      <span className="text-xs text-[#94A3B8]">{type.description}</span>
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
                className="flex items-center gap-2 px-3 py-2 bg-[#FAFAFA] border border-[#D1D5DB] hover:border-[#94A3B8] text-[#475569] hover:text-[#0F172A] rounded-md text-sm transition-colors"
              >
                <IconTemplate size={15} />
                Browse Templates
              </button>
              {selectedTemplate && (
                <div className="flex items-center justify-between px-3 py-2 bg-[#5B57D1]/10 border border-[#5B57D1]/30 rounded-md">
                  <span className="text-sm text-[#5B57D1] truncate">
                    Template: {selectedTemplate.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearTemplate}
                    className="text-[#64748B] hover:text-[#0F172A] transition-colors ml-2 shrink-0"
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
                className="px-4 py-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-[#5B57D1] hover:bg-[#4F4BC4] text-white rounded-md transition-colors"
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
