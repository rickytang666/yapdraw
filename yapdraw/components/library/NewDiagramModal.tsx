'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import type { DiagramType } from '@/types/library'

const DIAGRAM_TYPES: { value: DiagramType; label: string; description: string }[] = [
  { value: 'freeform', label: 'Freeform', description: 'Open canvas, no constraints' },
  { value: 'flowchart', label: 'Flowchart', description: 'Process flows and decisions' },
  { value: 'architecture', label: 'Architecture', description: 'System and component diagrams' },
  { value: 'sequence', label: 'Sequence', description: 'Interaction and timing diagrams' },
  { value: 'er', label: 'ER Diagram', description: 'Entity-relationship models' },
]

interface Props {
  onConfirm: (name: string, diagramType: DiagramType) => void
  onCancel: () => void
}

export default function NewDiagramModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>('freeform')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(name.trim() || 'Untitled Diagram', diagramType)
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-base">New Diagram</h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-sm">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Untitled Diagram"
              className="bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none rounded-md px-3 py-2 text-white text-sm placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Diagram Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-sm">Type</label>
            <div className="grid grid-cols-1 gap-2">
              {DIAGRAM_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDiagramType(type.value)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors ${
                    diagramType === type.value
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{type.label}</span>
                    <span className="text-xs text-zinc-500">{type.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
            >
              Create Diagram
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
