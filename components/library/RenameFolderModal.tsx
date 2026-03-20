'use client'

import { useEffect, useRef, useState } from 'react'
import { IconFolder, IconX } from '@tabler/icons-react'
import type { Folder } from '@/types/library'

interface Props {
  folder: Pick<Folder, 'id' | 'name'>
  onConfirm: (name: string) => void | Promise<void>
  onCancel: () => void
}

export default function RenameFolderModal({ folder, onConfirm, onCancel }: Props) {
  const [name, setName] = useState(folder.name)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = name.trim()
    if (!next || next === folder.name) {
      onCancel()
      return
    }

    setIsSaving(true)
    try {
      await onConfirm(next)
    } finally {
      setIsSaving(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <IconFolder size={18} className="text-placeholder" />
            <h2 className="text-foreground font-semibold text-base">Rename folder</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-placeholder hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-muted text-sm">Folder name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Folder name"
              className="bg-white border border-border focus:border-primary outline-none rounded-md px-3 py-2 text-foreground text-sm placeholder:text-placeholder transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-md"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isSaving ? 'Saving…' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
