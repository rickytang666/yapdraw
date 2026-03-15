'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX, IconTemplate } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { DiagramType, DiagramTemplate } from '@/types/library'
import TemplatePicker from './TemplatePicker'

const DIAGRAM_TYPES: { value: DiagramType; label: string; description: string }[] = [
  { value: 'freeform', label: 'Freeform', description: 'Open canvas' },
  { value: 'system-architecture', label: 'Architecture', description: 'Systems & components' },
  { value: 'operations-flowchart', label: 'Flowchart', description: 'Processes & decisions' },
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="rounded-2xl shadow-2xl w-full max-w-md mx-4"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>New Diagram</h2>
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

          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            {/* Name */}
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Untitled Diagram"
              className="text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />

            {/* Type */}
            <div className="grid grid-cols-3 gap-2">
              {DIAGRAM_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDiagramType(type.value)}
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-center transition-all"
                  style={{
                    background: diagramType === type.value ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    border: diagramType === type.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                    color: diagramType === type.value ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{type.description}</span>
                </button>
              ))}
            </div>

            {/* Template */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <IconTemplate size={15} />
                Browse Templates
              </button>
              {selectedTemplate && (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}
                >
                  <span className="text-sm truncate" style={{ color: 'var(--accent)' }}>
                    {selectedTemplate.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearTemplate}
                    className="ml-2 shrink-0 transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
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
                className="px-4 py-2 text-sm rounded-xl transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Create
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  )
}
