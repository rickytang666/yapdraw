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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <IconFolder size={18} className="text-zinc-400" />
            <h2 className="text-white font-semibold text-base">Rename folder</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-sm">Folder name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Folder name"
              className="bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none rounded-md px-3 py-2 text-white text-sm placeholder-zinc-500 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isSaving ? 'Saving…' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
